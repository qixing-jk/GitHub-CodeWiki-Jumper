import { parseArgs } from 'node:util'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { build } from 'vite'
import { assertJumperLinks } from '../tests/helpers/jumper.mjs'
import { runAuthenticatedChecks } from './lib/authenticated-checks.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

const { values } = parseArgs({
  options: {
    help: { type: 'boolean' },
    account: { type: 'string' },
    own: { type: 'string' },
    other: { type: 'string', default: 'microsoft/playwright' },
    fork: { type: 'string' },
    empty: { type: 'string' },
    private: { type: 'string' },
    cdp: { type: 'string' },
    'extension-script': { type: 'boolean' },
    output: { type: 'string' },
  },
})

if (values.help) {
  console.log(`Usage: pnpm test:authenticated --own OWNER/REPO (--cdp URL | --extension-script) [options]

  --cdp URL        Connect to the browser you selected and already signed into
  --extension-script  Generate a run-code file for your connected Playwright extension session
  --account LOGIN  Expected GitHub login (default: owner of --own)
  --other REPO     Another user's repository (default: microsoft/playwright)
  --fork REPO      Optional fork owned by the expected account
  --empty REPO     Optional empty repository owned by the expected account
  --private REPO   Optional private repository owned by the expected account
  --output PATH    Report and failure screenshots (default: temporary directory)

Uses Playwright CDP or an existing extension session. Browser startup and login are managed outside this project.`)
} else {
  try {
    await main(values)
  } catch (error) {
    // Connection errors can contain URLs; do not print an endpoint credential.
    console.error(
      values.cdp ? error.message.replaceAll(values.cdp, '[CDP endpoint]') : error.message
    )
    process.exitCode = 1
  }
}

async function main(options) {
  if (!options.own) throw new Error('--own is required')
  if (!!options.cdp === !!options['extension-script']) {
    throw new Error('Choose --cdp URL or --extension-script')
  }
  options.account ||= options.own.split('/')[0]
  if (!/^[a-z\d][a-z\d-]*$/i.test(options.account)) throw new Error('Invalid --account')
  const repositories = Object.fromEntries(
    ['own', 'other', 'fork', 'empty', 'private'].map((name) => [name, options[name]])
  )
  for (const [name, repository] of Object.entries(repositories)) {
    if (!repository) continue
    if (!/^[a-z\d][a-z\d-]*\/[\w.-]+$/i.test(repository) || /\/(?:\.|\.\.)$/.test(repository)) {
      throw new Error(`--${name} must be OWNER/REPO`)
    }
    const owned = repository.split('/')[0].toLowerCase() === options.account.toLowerCase()
    if ((name === 'other') === owned) {
      throw new Error(
        `--${name} must ${name === 'other' ? 'not ' : ''}belong to ${options.account}`
      )
    }
  }

  const output = options.output
    ? resolve(options.output)
    : await mkdtemp(join(tmpdir(), 'jumper-report-'))
  await mkdir(output, { recursive: true })
  if (options.cdp) console.log(`Report: ${join(output, 'report.json')}`)
  const report = { account: options.account, results: [] }
  const saveReport = () => writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  let buildDirectory, browser, page
  try {
    buildDirectory = await mkdtemp(join(tmpdir(), 'jumper-build-'))
    const require = createRequire(import.meta.url)
    const typecheck = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc')], {
      cwd: root,
      stdio: 'inherit',
    })
    if (typecheck.status !== 0) throw new Error('TypeScript check failed')
    await build({ root, logLevel: 'warn', build: { outDir: buildDirectory, emptyOutDir: true } })
    const script = await readFile(join(buildDirectory, 'github-codewiki-jumper.user.js'), 'utf8')
    if (options['extension-script']) {
      const filename = join(output, 'extension-check.js')
      // Self-contained code runs in Playwright CLI's VM without imports or local skill helpers.
      await writeFile(
        filename,
        `async (page) => {
        const assertJumperLinks = ${assertJumperLinks.toString()};
        const runAuthenticatedChecks = ${runAuthenticatedChecks.toString()};
        const target = await page.context().newPage();
        target.setDefaultTimeout(10000);
        target.setDefaultNavigationTimeout(30000);
        try {
          return await runAuthenticatedChecks(target, {
            ...${JSON.stringify({ account: options.account, repositories, script })},
            onResult: async (result) => {
              if (result.status === 'failed') {
                try {
                  const screenshot = ${JSON.stringify(output)} + '/' + result.name + '.png';
                  await target.screenshot({ path: screenshot, timeout: 5000 });
                  result.screenshot = screenshot;
                } catch {}
              }
            }
          });
        } finally { await target.close(); }
      }`
      )
      console.log(
        `Run in your already connected extension session:\nplaywright-cli -s=YOUR_SESSION run-code --filename "${filename}"`
      )
      return
    }
    browser = await chromium.connectOverCDP(options.cdp)
    const context = browser.contexts()[0]
    if (!context) throw new Error('Selected browser has no default context')
    page = await context.newPage()
    page.setDefaultTimeout(10_000)
    page.setDefaultNavigationTimeout(30_000)
    await runAuthenticatedChecks(page, {
      account: options.account,
      repositories,
      script,
      onResult: async (result) => {
        if (result.status === 'failed') {
          const screenshot = `${result.name}.png`
          try {
            await page.screenshot({ path: join(output, screenshot), timeout: 5000 })
            result.screenshot = screenshot
          } catch {
            /* Keep the original failure if the page cannot be captured. */
          }
        }
        report.results.push(result)
        console.log(
          `${result.status.toUpperCase()} ${result.name}${result.reason ? `: ${result.reason}` : ''}`
        )
        await saveReport()
      },
    })
    if (report.results.some((result) => result.status === 'failed')) process.exitCode = 1
  } catch (error) {
    report.results.push({ name: 'setup', status: 'failed', error: error.message })
    process.exitCode = 1
    console.error(error.message)
  } finally {
    try {
      if (options.cdp || report.results.length) await saveReport()
    } finally {
      try {
        await page?.close()
      } finally {
        try {
          // Closing a CDP connection disconnects this client; leave the user's context open.
          if (browser) await browser.close()
        } finally {
          if (
            buildDirectory &&
            dirname(buildDirectory) === tmpdir() &&
            basename(buildDirectory).startsWith('jumper-build-')
          ) {
            await rm(buildDirectory, { recursive: true, force: true })
          }
        }
      }
    }
  }
}
