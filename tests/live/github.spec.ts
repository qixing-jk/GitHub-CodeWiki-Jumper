import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { assertJumperLinks } from '../helpers/jumper.mjs'

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

  await assertJumperLinks(page, repositoryName)

  await page.evaluate(() => {
    document.dispatchEvent(new Event('turbo:load'))
    document.dispatchEvent(new Event('turbo:render'))
  })
  await expect(page.locator('#jumper-buttons-container')).toHaveCount(1)
})
