import { JUMPER_CONTAINER_ID, INJECTION_SELECTOR } from '../constants'
import { buildDeepWikiUrl, buildCodeWikiUrl } from './url-builder'
import deepWikiIconUrl from '@/assets/deep-wiki.svg'
import codeWikiIconUrl from '@/assets/code-wiki.svg'

const createButtonsContainer = (): HTMLDivElement => {
  const container = document.createElement('div')
  container.id = JUMPER_CONTAINER_ID
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
  // 图标和文字间距
  link.style.gap = '8px'

  const img = document.createElement('img')
  img.src = iconUrl
  img.style.width = '16px'
  img.style.height = '16px'
  // 避免 inline 图片带来的基线偏差
  img.style.display = 'block'

  link.appendChild(img)
  link.appendChild(document.createTextNode(text))

  return link
}

export const addButtons = () => {
  const targetElement = document.querySelector(INJECTION_SELECTOR)

  if (!targetElement || document.getElementById(JUMPER_CONTAINER_ID)) {
    return
  }

  const urlx = new URL(window.location.href)
  const deepwikiUrl = buildDeepWikiUrl(urlx.pathname)
  const codewikiUrl = buildCodeWikiUrl(urlx.hostname, urlx.pathname)

  const buttonsContainer = createButtonsContainer()
  const deepwikiLink = createLink(deepwikiUrl, 'DeepWiki', deepWikiIconUrl)
  const codewikiLink = createLink(codewikiUrl, 'CodeWiki', codeWikiIconUrl)

  const deepwikiDiv = document.createElement('div')
  deepwikiDiv.classList.add('mt-2')
  deepwikiDiv.appendChild(deepwikiLink)

  const codewikiDiv = document.createElement('div')
  codewikiDiv.classList.add('mt-2')
  codewikiDiv.appendChild(codewikiLink)

  buttonsContainer.appendChild(deepwikiDiv)
  buttonsContainer.appendChild(codewikiDiv)

  targetElement.insertAdjacentElement('afterend', buttonsContainer)
}
