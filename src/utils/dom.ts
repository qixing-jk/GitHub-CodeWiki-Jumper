import { JUMPER_CONTAINER_ID, INJECTION_SELECTOR, SIDEBAR_SELECTOR } from '@/constants'
import {
  buildDeepWikiUrl,
  buildCodeWikiUrl,
  buildZReadUrl,
  getRepositoryName,
  buildRepositoryPath,
} from './url-builder'
import deepWikiIconUrl from '@/assets/deep-wiki.svg'
import codeWikiIconUrl from '@/assets/code-wiki.svg'
import zreadIconUrl from '@/assets/zread.svg'
import zreadIconDarkUrl from '@/assets/zread-dark.svg'

const isDarkMode = (): boolean => {
  const html = document.documentElement
  if (html?.getAttribute('data-color-mode') === 'dark') {
    return true
  }
  if (html?.classList.contains('dark') || html?.classList.contains('color-mode-dark')) {
    return true
  }

  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  return !!media?.matches
}

const getZreadIcon = () => (isDarkMode() ? zreadIconDarkUrl : zreadIconUrl)

const createButtonsContainer = (): HTMLDivElement => {
  const container = document.createElement('div')
  container.id = JUMPER_CONTAINER_ID
  container.setAttribute('translate', 'no')
  container.classList.add('notranslate')
  return container
}

const createLink = (url: string, text: string, iconUrl: string): HTMLAnchorElement => {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.classList.add('Link', 'Link--muted')

  // 设置 inline-flex
  link.style.display = 'inline-flex'
  link.style.alignItems = 'center'
  link.style.whiteSpace = 'nowrap'
  // 图标和文字间距
  link.style.gap = '8px'

  const img = document.createElement('img')
  img.src = iconUrl
  img.style.width = '16px'
  img.style.height = '16px'
  img.style.flexShrink = '0'
  // 避免 inline 图片带来的基线偏差
  img.style.display = 'block'

  link.appendChild(img)
  link.appendChild(document.createTextNode(text))

  return link
}

export const addButtons = () => {
  const repositoryName = getRepositoryName()
  if (!repositoryName) {
    return
  }

  const repositoryPath = buildRepositoryPath(repositoryName)
  if (!repositoryPath) {
    return
  }

  const targetElement = document.querySelector(INJECTION_SELECTOR)
  if (!targetElement || document.getElementById(JUMPER_CONTAINER_ID)) {
    return
  }

  const urlx = new URL(window.location.href)
  const buttonsContainer = createButtonsContainer()

  for (const link of [
    createLink(buildDeepWikiUrl(repositoryPath), 'DeepWiki', deepWikiIconUrl),
    createLink(buildCodeWikiUrl(urlx.hostname, repositoryPath), 'CodeWiki', codeWikiIconUrl),
    createLink(buildZReadUrl(repositoryPath), 'Zread', getZreadIcon()),
  ]) {
    const div = document.createElement('div')
    div.classList.add('mt-2')
    div.appendChild(link)
    buttonsContainer.appendChild(div)
  }

  // 优先插入到 About 区块末尾（"Report repository" 行之后），否则追加到 About 区块内
  const sidebar = document.querySelector(SIDEBAR_SELECTOR)
  const reportRow = sidebar?.querySelector('a[href*="/contact/report-content"]')?.closest('.mt-2')
  if (reportRow) {
    reportRow.insertAdjacentElement('afterend', buttonsContainer)
    return
  }
  targetElement.appendChild(buttonsContainer)
}
