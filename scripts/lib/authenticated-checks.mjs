import { assertJumperLinks } from '../../tests/helpers/jumper.mjs'

export async function runAuthenticatedChecks(
  page,
  { account, repositories, script, onResult = async () => {} }
) {
  const report = { account, results: [] }
  const record = async (name, action) => {
    let result
    try {
      result = { name, status: 'passed', ...(await action()) }
    } catch (error) {
      result = { name, status: 'failed', error: error.message }
    }
    report.results.push(result)
    await onResult(result, page)
    return result.status === 'passed'
  }
  const skip = async (name, reason) => {
    const result = { name, status: 'skipped', reason }
    report.results.push(result)
    await onResult(result, page)
  }
  const assertAccount = async () => {
    const login = await page.evaluate(() =>
      document.querySelector('meta[name="user-login"]')?.getAttribute('content')
    )
    if (login?.toLowerCase() !== account.toLowerCase()) {
      throw new Error(`Expected GitHub account ${account}; found ${login || 'signed out'}`)
    }
  }
  const open = async (repository) => {
    const response = await page.goto(`https://github.com/${repository}`, {
      waitUntil: 'domcontentloaded',
    })
    await assertAccount()
    if (!response?.ok()) throw new Error(`Repository returned HTTP ${response?.status()}`)
    // Avoid attributing an installed userscript's result to this build.
    if (await page.locator('#jumper-buttons-container').count()) {
      throw new Error('An installed userscript already injected buttons; disable it for this check')
    }
    await page.evaluate(script)
  }
  const assertPlacement = async (repository, own) => {
    await assertJumperLinks(page, repository)
    await page.waitForFunction(
      (own) => {
        const container = document.getElementById('jumper-buttons-container')
        const section = container?.closest('[class*="sidebarSection"]')
        const heading = section?.querySelector('h2')?.textContent?.trim()
        const report = section?.querySelector('a[href*="/contact/report-content"]')
        return (
          heading === 'About' &&
          !!report === !own &&
          (report?.closest('.mt-2')?.nextElementSibling === container) === !own
        )
      },
      own,
      { polling: 100, timeout: 10_000 }
    )
    return { repository, reportRow: !own }
  }

  const originalViewport = page.viewportSize()
  await page.setViewportSize({ width: 1280, height: 900 })
  try {
    // Account mismatch aborts before any injection, rather than passing signed out.
    await open(repositories.own)
    const ownPassed = await record('own', () => assertPlacement(repositories.own, true))
    const file = page.locator(`a[href^="/${repositories.own}/blob/"]:visible`).first()
    if (ownPassed && (await file.count())) {
      await record('navigation', async () => {
        const filePath = new URL(await file.getAttribute('href'), page.url()).pathname
        await page.evaluate(() => {
          window.__jumperAcceptanceDocument = true
        })
        const assertFile = async () => {
          await page.waitForFunction(
            (path) =>
              location.pathname === path &&
              !document.querySelector('div[class*="borderGrid"]') &&
              !document.getElementById('jumper-buttons-container'),
            filePath,
            { polling: 100, timeout: 10_000 }
          )
        }
        await file.evaluate((element) => element.click())
        await assertFile()
        await page
          .getByRole('link', { name: 'Code', exact: true })
          .first()
          .evaluate((element) => element.click())
        await assertPlacement(repositories.own, true)
        await page.goBack({ waitUntil: 'domcontentloaded' })
        await assertFile()
        await page.goForward({ waitUntil: 'domcontentloaded' })
        await assertPlacement(repositories.own, true)
        if (!(await page.evaluate(() => window.__jumperAcceptanceDocument))) {
          throw new Error('Navigation replaced the document instead of exercising SPA recovery')
        }
        await assertAccount()
      })
    } else {
      await skip('navigation', ownPassed ? 'Own repository has no file link' : 'Own check failed')
    }
    await record('narrow', async () => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForFunction(
        () => {
          const containers = document.querySelectorAll('#jumper-buttons-container')
          return containers.length === 1 && !containers[0].getBoundingClientRect().width
        },
        undefined,
        { polling: 100, timeout: 10_000 }
      )
    })
    await page.setViewportSize({ width: 1280, height: 900 })

    for (const name of ['other', 'fork', 'empty', 'private']) {
      const repository = repositories[name]
      if (!repository) {
        await skip(name, 'Not configured')
        continue
      }
      await record(name, async () => {
        await open(repository)
        const details = await assertPlacement(repository, name !== 'other')
        if (name === 'fork')
          await page.getByText('forked from', { exact: false }).waitFor({ state: 'visible' })
        if (name === 'empty') {
          if (await page.locator(`a[href^="/${repository}/blob/"]`).count()) {
            throw new Error('The configured empty repository contains files')
          }
        }
        if (name === 'private')
          await page.getByText('Private', { exact: true }).first().waitFor({ state: 'visible' })
        return details
      })
    }
    return report
  } finally {
    if (originalViewport) await page.setViewportSize(originalViewport)
  }
}
