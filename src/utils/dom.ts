import {
  JUMPER_CONTAINER_ID,
  INJECTION_SELECTOR,
  SIDEBAR_SELECTOR,
  REPORT_LINK_SELECTOR,
} from '@/constants'
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

// GitHub 通过根元素 color-scheme 表达当前主题，深色时计算值为 dark
const isDarkMode = (): boolean => getComputedStyle(document.documentElement).colorScheme === 'dark'

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

  link.style.display = 'inline-flex'
  link.style.alignItems = 'center'
  link.style.whiteSpace = 'nowrap'
  link.style.gap = '8px'

  const img = document.createElement('img')
  img.src = iconUrl
  img.style.width = '16px'
  img.style.height = '16px'
  img.style.flexShrink = '0'
  // inline 图片会受文字基线影响产生偏移，改成 block 精确对齐
  img.style.display = 'block'

  link.appendChild(img)
  link.appendChild(document.createTextNode(text))

  return link
}

interface InjectionAnchor {
  target: Element
  position: InsertPosition
}

// 别人的仓库都有 Report 行，插到它后面最稳定；自己的仓库 GitHub 不显示 Report 链接，退回插到 About 区块末尾。
// 查找限定在桌面侧边栏内，避免插到页头或移动端的 About 副本里。
const findInjectionAnchor = (): InjectionAnchor | null => {
  const sidebar = document.querySelector(SIDEBAR_SELECTOR)
  if (!sidebar) {
    return null
  }

  const reportRow = sidebar.querySelector(REPORT_LINK_SELECTOR)?.closest('.mt-2')
  if (reportRow) {
    return { target: reportRow, position: 'afterend' }
  }

  const aboutSection = document.querySelector(INJECTION_SELECTOR)
  return aboutSection ? { target: aboutSection, position: 'beforeend' } : null
}

export const addButtons = () => {
  const repositoryName = getRepositoryName()
  if (!repositoryName) {
    return
  }

  const repositoryPath = buildRepositoryPath(repositoryName)
  const anchor = findInjectionAnchor()
  if (!anchor || document.getElementById(JUMPER_CONTAINER_ID)) {
    return
  }

  const buttonsContainer = createButtonsContainer()

  for (const link of [
    createLink(buildDeepWikiUrl(repositoryPath), 'DeepWiki', deepWikiIconUrl),
    createLink(
      buildCodeWikiUrl(window.location.hostname, repositoryPath),
      'CodeWiki',
      codeWikiIconUrl
    ),
    createLink(buildZReadUrl(repositoryPath), 'Zread', getZreadIcon()),
  ]) {
    const div = document.createElement('div')
    div.classList.add('mt-2')
    div.appendChild(link)
    buttonsContainer.appendChild(div)
  }

  anchor.target.insertAdjacentElement(anchor.position, buttonsContainer)
}
