import { expect, test, type Page, type Route } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const repositoryUrl = 'https://github.com/qixing-jk/GitHub-CodeWiki-Jumper'
const userscriptPath = new URL('../../dist/github-codewiki-jumper.user.js', import.meta.url)

for (const { classes, sidebarClass, sectionClass } of [
  // 未登录页面的侧边栏类名（2026-10 抓取）
  {
    classes: 'HideWhenNarrow__nfGOuR border-0',
    sidebarClass: 'borderGrid__VCnF9i',
    sectionClass: 'sidebarSection__oqw6Y8',
  },
  // 登录页面的侧边栏类名（2026-10 抓取）
  {
    classes: 'OverviewSidebar-module_PLu75W_HideWhenNarrow border-0',
    sidebarClass: 'CodeViewSidebar-module_6TmlqG_borderGrid',
    sectionClass: 'SidebarSection-module_TOhNLG_sidebarSection',
  },
]) {
  for (const hasReportRow of [true, false]) {
    test(`injects into desktop About with ${classes}, report row: ${hasReportRow}`, async ({
      page,
    }) => {
      // 页面在桌面侧边栏之外还有 About 副本，mock 中包含它们以验证脚本不会误注入
      await page.route(repositoryUrl, (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `
          <head>
            <meta name="octolytics-dimension-repository_nwo" content="qixing-jk/GitHub-CodeWiki-Jumper">
          </head>
          <section id="mobile-about" class="${sectionClass}">
            <h2>About</h2>
          </section>
          <div class="${sidebarClass}">
            <div id="desktop-about" class="${sectionClass} ${classes}">
              <h2>About</h2>
              ${hasReportRow ? '<div class="mt-2"><a href="/contact/report-content?report=repo">Report repository</a></div>' : ''}
            </div>
            <div id="releases" class="${sectionClass}"><h2>Releases</h2></div>
          </div>`,
        })
      )
      await page.goto(repositoryUrl)
      await page.addScriptTag({ content: await readFile(userscriptPath, 'utf8') })

      const container = page.locator('#jumper-buttons-container')
      await expect(container).toBeVisible()
      await expect(page.locator('#desktop-about #jumper-buttons-container')).toHaveCount(1)
      await expect(page.locator('#mobile-about #jumper-buttons-container')).toHaveCount(0)
      await expect(page.locator('#releases #jumper-buttons-container')).toHaveCount(0)
      await expect(container.getByRole('link', { name: 'DeepWiki', exact: true })).toHaveAttribute(
        'href',
        'https://deepwiki.com/qixing-jk/GitHub-CodeWiki-Jumper'
      )
      if (hasReportRow) {
        await expect(page.locator('#desktop-about .mt-2 + #jumper-buttons-container')).toHaveCount(
          1
        )
      }
      await page.evaluate(() => document.dispatchEvent(new Event('turbo:load')))
      await expect(container).toHaveCount(1)
    })
  }
}

// Zread 图标随主题切换：深色版图标以 b8b8b8 填充为特征，两个用例成对证明图标确实会切换
const zreadIconLocator = (page: Page) =>
  page.locator('#jumper-buttons-container a:has-text("Zread") img')

const mockRepositoryPage = (route: Route) =>
  route.fulfill({
    contentType: 'text/html',
    body: `
    <head>
      <meta name="octolytics-dimension-repository_nwo" content="qixing-jk/GitHub-CodeWiki-Jumper">
    </head>
    <div class="borderGrid__VCnF9i">
      <div class="sidebarSection__oqw6Y8 HideWhenNarrow__nfGOuR border-0">
        <h2>About</h2>
      </div>
    </div>`,
  })

test('switches the Zread icon in dark color scheme', async ({ page }) => {
  await page.route(repositoryUrl, mockRepositoryPage)
  await page.goto(repositoryUrl)
  // GitHub 深色主题下根元素的 color-scheme 计算值为 dark
  await page.addStyleTag({ content: ':root { color-scheme: dark }' })
  await page.addScriptTag({ content: await readFile(userscriptPath, 'utf8') })

  await expect(zreadIconLocator(page)).toHaveAttribute('src', /b8b8b8/)
})

test('keeps the light Zread icon in light color scheme', async ({ page }) => {
  await page.route(repositoryUrl, mockRepositoryPage)
  await page.goto(repositoryUrl)
  await page.addScriptTag({ content: await readFile(userscriptPath, 'utf8') })

  await expect(zreadIconLocator(page)).not.toHaveAttribute('src', /b8b8b8/)
})
