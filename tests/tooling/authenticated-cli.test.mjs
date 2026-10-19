import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import test from 'node:test'
import { createServer } from 'node:http'
import { runInNewContext } from 'node:vm'
import { chromium } from '@playwright/test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'

test('documents the standalone login check without starting a browser', () => {
  const result = spawnSync(process.execPath, ['scripts/test-authenticated.mjs', '--help'], {
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /--account/)
  assert.match(result.stdout, /--cdp/)
  assert.match(result.stdout, /--extension-script/)
  assert.doesNotMatch(result.stdout, /--profile|--login|--channel/)
})

for (const [args, message] of [
  [[], /--own is required/],
  [['--own', 'alice/repo'], /Choose --cdp URL or --extension-script/],
  [
    ['--account', 'alice', '--own', 'bob/repo', '--cdp', 'http://localhost:9222'],
    /--own must belong to alice/,
  ],
]) {
  test(`rejects invalid configuration before building: ${args.join(' ') || 'missing options'}`, () => {
    const result = spawnSync(process.execPath, ['scripts/test-authenticated.mjs', ...args], {
      encoding: 'utf8',
    })
    assert.equal(result.status, 1)
    assert.match(result.stderr, message)
  })
}

test('CDP run preserves existing tabs, browser session, and the release bundle', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jumper-cdp-test-'))
  const profile = join(directory, 'browser')
  const output = join(directory, 'report')
  const bundlePath = 'dist/github-codewiki-jumper.user.js'
  const bundleBefore = await readFile(bundlePath)
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    args: ['--remote-debugging-port=0'],
  })
  try {
    const sentinel = context.pages()[0]
    await sentinel.evaluate(() => {
      window.userTab = 'keep me'
    })
    let wrongHeading = false
    await context.route('https://github.com/**', (route) => {
      const repo = new URL(route.request().url()).pathname.slice(1)
      return route.fulfill({
        contentType: 'text/html',
        body: `
        <meta name="user-login" content="alice">
        <meta name="octolytics-dimension-repository_nwo" content="${repo}">
        <style>@media(max-width:767px){.HideWhenNarrow{display:none}}</style>
        <div class="borderGrid_hash"><section class="sidebarSection_hash HideWhenNarrow">
          <h2>${wrongHeading && !repo.startsWith('alice/') ? 'Releases' : 'About'}</h2>
          ${repo.startsWith('alice/') ? '' : '<div class="mt-2"><a href="/contact/report-content">Report repository</a></div>'}
        </section></div>`,
      })
    })
    const [port] = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')
    const run = () =>
      new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [
          'scripts/test-authenticated.mjs',
          '--own',
          'alice/repo',
          '--cdp',
          `http://127.0.0.1:${port}`,
          '--output',
          output,
        ])
        let text = ''
        child.stdout.on('data', (data) => {
          text += data
        })
        child.stderr.on('data', (data) => {
          text += data
        })
        child.on('error', reject)
        child.on('exit', (status) => resolve({ status, text }))
      })
    const result = await run()
    assert.equal(result.status, 0, result.text)
    const report = JSON.parse(await readFile(join(output, 'report.json'), 'utf8'))
    assert.deepEqual(
      report.results.filter((r) => r.status === 'passed').map((r) => r.name),
      ['own', 'narrow', 'other']
    )
    const prepared = spawnSync(
      process.execPath,
      [
        'scripts/test-authenticated.mjs',
        '--own',
        'alice/repo',
        '--extension-script',
        '--output',
        output,
      ],
      { encoding: 'utf8' }
    )
    assert.equal(prepared.status, 0, prepared.stderr)
    assert.match(prepared.stdout, /run-code --filename/)
    const extensionCode = await readFile(join(output, 'extension-check.js'), 'utf8')
    const checkThroughExtension = runInNewContext(`(${extensionCode})`, { URL })
    const extensionReport = await checkThroughExtension(sentinel)
    assert.deepEqual(
      Array.from(
        extensionReport.results.filter((r) => r.status === 'passed'),
        (r) => r.name
      ),
      ['own', 'narrow', 'other']
    )
    assert.equal(context.pages().length, 1)
    assert.equal(await sentinel.evaluate(() => window.userTab), 'keep me')
    wrongHeading = true
    const failure = await run()
    assert.equal(failure.status, 1, failure.text)
    const failedReport = JSON.parse(await readFile(join(output, 'report.json'), 'utf8'))
    const failedCase = failedReport.results.find((result) => result.name === 'other')
    assert.equal(failedCase.status, 'failed')
    assert.equal(failedCase.screenshot, 'other.png')
    assert.ok((await readFile(join(output, 'other.png'))).length > 0)
    assert.equal(await sentinel.evaluate(() => window.userTab), 'keep me')
    assert.equal(context.pages().length, 1)
    assert.deepEqual(await readFile(bundlePath), bundleBefore)
  } finally {
    await context.close()
    if (dirname(directory) === tmpdir() && basename(directory).startsWith('jumper-cdp-test-')) {
      await rm(directory, { recursive: true, force: true })
    }
  }
})

test('redacts CDP credentials from connection failures and saved reports', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jumper-redaction-test-'))
  const server = createServer()
  server.on('upgrade', (_request, socket) => {
    socket.end('HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\n\r\n')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const endpoint = `ws://127.0.0.1:${server.address().port}/browser/sample-private-token`
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [
        'scripts/test-authenticated.mjs',
        '--own',
        'alice/repo',
        '--cdp',
        endpoint,
        '--output',
        directory,
      ])
      let output = ''
      child.stdout.on('data', (data) => {
        output += data
      })
      child.stderr.on('data', (data) => {
        output += data
      })
      child.on('error', reject)
      child.on('exit', (status) => resolve({ status, output }))
    })
    assert.equal(result.status, 1)
    assert.ok(
      !result.output.includes('sample-private-token'),
      'terminal output must redact the endpoint credential'
    )
    assert.match(result.output, /\[CDP endpoint\]/)
    const savedReport = await readFile(join(directory, 'report.json'), 'utf8')
    assert.ok(
      !savedReport.includes('sample-private-token'),
      'saved report must redact the endpoint credential'
    )
    const setup = JSON.parse(savedReport).results.find((result) => result.name === 'setup')
    assert.equal(setup.status, 'failed')
    assert.match(setup.error, /\[CDP endpoint\]/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
    if (
      dirname(directory) === tmpdir() &&
      basename(directory).startsWith('jumper-redaction-test-')
    ) {
      await rm(directory, { recursive: true, force: true })
    }
  }
})
