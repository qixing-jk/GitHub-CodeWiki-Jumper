import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from '@playwright/test'
import { build } from 'vite'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { runAuthenticatedChecks } from '../../scripts/lib/authenticated-checks.mjs'

let browser
let script
let buildDirectory
before(async () => {
  buildDirectory = await mkdtemp(join(tmpdir(), 'jumper-tooling-test-'))
  await build({ logLevel: 'silent', build: { outDir: buildDirectory, emptyOutDir: true } })
  script = await readFile(join(buildDirectory, 'github-codewiki-jumper.user.js'), 'utf8')
  browser = await chromium.launch()
})
after(async () => {
  await browser?.close()
  if (
    dirname(buildDirectory) === tmpdir() &&
    basename(buildDirectory).startsWith('jumper-tooling-test-')
  ) {
    await rm(buildDirectory, { recursive: true, force: true })
  }
})

test('checks both ownership layouts and restores links through SPA navigation', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  try {
    await page.route('https://github.com/**', (route) => {
      const pathname = new URL(route.request().url()).pathname
      const repo = pathname.split('/').filter(Boolean).slice(0, 2).join('/')
      return route.fulfill({
        contentType: 'text/html',
        body: `<meta name="user-login" content="alice">
          <meta name="octolytics-dimension-repository_nwo" content="${repo}">
          <style>@media(max-width:767px){.HideWhenNarrow{display:none}}</style>
          <a href="/${repo}" id="code">Code</a><main></main>
          <script>
          const repository = ${JSON.stringify(repo)};
          function render() {
            const file = location.pathname.includes('/blob/');
            document.title = file ? 'README.md at main' : repository;
            document.querySelector('main').innerHTML = file ? '<h1>README.md</h1>' :
              '<a href="/' + repository + '/blob/main/README.md">README.md</a>' +
              '<div class="CodeViewSidebar-module_hash_borderGrid"><section class="SidebarSection-module_hash_sidebarSection HideWhenNarrow"><h2>About</h2>' +
              (repository.startsWith('alice/') ? '' : '<div class="mt-2"><a href="/contact/report-content">Report repository</a></div>') +
              '</section></div>';
          }
          document.addEventListener('click', event => {
            const link = event.target.closest('a');
            if (!link || !link.pathname.startsWith('/' + repository)) return;
            event.preventDefault(); history.pushState({}, '', link.href); render();
          });
          window.addEventListener('popstate', render); render();
          </script>`,
      })
    })
    const report = await runAuthenticatedChecks(page, {
      account: 'alice',
      repositories: { own: 'alice/repo', other: 'other/repo' },
      script,
    })
    assert.deepEqual(
      report.results.filter((result) => result.status === 'passed').map((result) => result.name),
      ['own', 'navigation', 'narrow', 'other']
    )
    assert.deepEqual(
      report.results.filter((result) => result.status === 'skipped').map((result) => result.name),
      ['fork', 'empty', 'private']
    )
    assert.equal(
      report.results.some((result) => result.status === 'failed'),
      false
    )
  } finally {
    await page.close()
  }
})

test('rejects another account before injecting the userscript', async () => {
  const page = await browser.newPage()
  try {
    await page.route('https://github.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<meta name="user-login" content="bob">',
      })
    )
    await assert.rejects(
      runAuthenticatedChecks(page, {
        account: 'alice',
        repositories: { own: 'alice/repo', other: 'other/repo' },
        script: 'window.unexpectedInjection = true',
      }),
      /Expected GitHub account alice; found bob/
    )
    assert.equal(await page.evaluate(() => window.unexpectedInjection), undefined)
  } finally {
    await page.close()
  }
})

test('rejects an installed userscript without removing its existing buttons', async () => {
  const page = await browser.newPage()
  try {
    await page.route('https://github.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<meta name="user-login" content="alice"><div id="jumper-buttons-container">existing</div>',
      })
    )
    await assert.rejects(
      runAuthenticatedChecks(page, {
        account: 'alice',
        repositories: { own: 'alice/repo' },
        script,
      }),
      /installed userscript already injected/
    )
    assert.equal(await page.locator('#jumper-buttons-container').textContent(), 'existing')
  } finally {
    await page.close()
  }
})

test('reports a configured empty repository with files as failed', async () => {
  const page = await browser.newPage()
  try {
    await page.route('https://github.com/**', (route) => {
      const repo = new URL(route.request().url()).pathname.slice(1)
      return route.fulfill({
        contentType: 'text/html',
        body: `
        <meta name="user-login" content="alice">
        <meta name="octolytics-dimension-repository_nwo" content="${repo}">
        <style>@media(max-width:767px){.HideWhenNarrow{display:none}}</style>
        <div class="borderGrid_hash"><section class="sidebarSection_hash HideWhenNarrow"><h2>About</h2></section></div>
        ${repo.endsWith('/notempty') ? '<a href="/alice/notempty/blob/main/README.md">README.md</a>' : ''}`,
      })
    })
    const report = await runAuthenticatedChecks(page, {
      account: 'alice',
      repositories: { own: 'alice/repo', empty: 'alice/notempty' },
      script,
    })
    assert.equal(report.results.find((result) => result.name === 'empty').status, 'failed')
    assert.match(report.results.find((result) => result.name === 'empty').error, /contains files/)
  } finally {
    await page.close()
  }
})

test('records an unavailable repository and continues with the remaining scenarios', async () => {
  const page = await browser.newPage()
  try {
    await page.route('https://github.com/**', (route) => {
      const repo = new URL(route.request().url()).pathname.slice(1)
      return route.fulfill({
        status: repo === 'other/missing' ? 404 : 200,
        contentType: 'text/html',
        body: `
          <meta name="user-login" content="alice">
          <meta name="octolytics-dimension-repository_nwo" content="${repo}">
          <style>@media(max-width:767px){.HideWhenNarrow{display:none}}</style>
          <div class="borderGrid_hash"><section class="sidebarSection_hash HideWhenNarrow"><h2>About</h2></section></div>
          <p>forked from upstream/repo</p>`,
      })
    })
    const failures = []
    const report = await runAuthenticatedChecks(page, {
      account: 'alice',
      repositories: { own: 'alice/repo', other: 'other/missing', fork: 'alice/fork' },
      script,
      onResult: async (result, currentPage) => {
        if (result.status === 'failed') {
          failures.push({ name: result.name, url: currentPage.url() })
          assert.ok((await currentPage.screenshot()).length > 0)
        }
      },
    })
    assert.equal(report.results.find((result) => result.name === 'own').status, 'passed')
    assert.match(report.results.find((result) => result.name === 'other').error, /HTTP 404/)
    assert.equal(report.results.find((result) => result.name === 'fork').status, 'passed')
    assert.deepEqual(failures, [{ name: 'other', url: 'https://github.com/other/missing' }])
  } finally {
    await page.close()
  }
})
