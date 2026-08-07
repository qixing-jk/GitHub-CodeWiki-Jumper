import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const repositoryName = 'qixing-jk/GitHub-CodeWiki-Jumper'
const repositoryUrl = `https://github.com/${repositoryName}`
const userscriptPath = fileURLToPath(
  new URL('../../dist/github-codewiki-jumper.user.js', import.meta.url)
)

test('injects the expected links into a live GitHub repository page', async ({ page }) => {
  const userscript = await readFile(userscriptPath, 'utf8')
  const response = await page.goto(repositoryUrl, { waitUntil: 'domcontentloaded' })
  expect(response, 'GitHub should return a document response').not.toBeNull()
  expect(response?.status(), 'GitHub repository page should load successfully').toBeLessThan(400)

  // Tampermonkey executes userscripts outside the page's CSP. Playwright's
  // bypassCSP context reproduces that boundary without starting before the DOM.
  await page.addScriptTag({ content: userscript })

  const container = page.locator('#jumper-buttons-container')
  await expect(container).toBeVisible()
  await expect(container).toHaveCount(1)

  const expectedLinks = [
    ['DeepWiki', `https://deepwiki.com/${repositoryName}`],
    ['CodeWiki', `https://codewiki.google/github.com/${repositoryName}`],
    ['Zread', `https://zread.ai/${repositoryName}`],
  ] as const

  for (const [name, href] of expectedLinks) {
    const link = container.getByRole('link', { name })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toHaveAttribute('target', '_blank')
  }

  await page.evaluate(() => {
    document.dispatchEvent(new Event('turbo:load'))
    document.dispatchEvent(new Event('turbo:render'))
  })
  await expect(container).toHaveCount(1)
})
