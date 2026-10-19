export async function assertJumperLinks(page, repository) {
  const expectedLinks = [
    ['DeepWiki', `https://deepwiki.com/${repository}`],
    ['CodeWiki', `https://codewiki.google/github.com/${repository}`],
    ['Zread', `https://zread.ai/${repository}`],
  ]
  await page.waitForFunction(
    (expected) => {
      const visible = (element) => {
        const bounds = element.getBoundingClientRect()
        return (
          bounds.width > 0 && bounds.height > 0 && getComputedStyle(element).visibility !== 'hidden'
        )
      }
      const containers = document.querySelectorAll('#jumper-buttons-container')
      const container = containers[0]
      if (
        containers.length !== 1 ||
        !visible(container) ||
        container.getAttribute('translate') !== 'no' ||
        !container.classList.contains('notranslate')
      )
        return false
      const links = [...container.querySelectorAll('a')]
      return (
        links.length === 3 &&
        expected.every(([name, href]) => {
          const link = links.find((element) => element.textContent.trim() === name)
          const image = link?.querySelector('img')
          return (
            link?.href === href &&
            visible(link) &&
            link.target === '_blank' &&
            image &&
            getComputedStyle(link).whiteSpace === 'nowrap' &&
            getComputedStyle(image).flexShrink === '0'
          )
        })
      )
    },
    expectedLinks,
    { polling: 100, timeout: 10_000 }
  )
}
