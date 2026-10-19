import { addButtons } from './dom'
import { JUMPER_CONTAINER_ID } from '@/constants'

let injectTimer: ReturnType<typeof setTimeout> | undefined

// 短时间内可能连续触发多次，用防抖合并；addButtons 会检查是否已注入，重复调用是安全的
const scheduleInjection = (delay = 200) => {
  if (injectTimer) {
    clearTimeout(injectTimer)
  }

  injectTimer = setTimeout(() => {
    injectTimer = undefined
    addButtons()
  }, delay)
}

// GitHub 是单页应用，切换仓库时侧边栏局部重渲染，需要观察重建后重新注入
const observeSidebar = () => {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(JUMPER_CONTAINER_ID)) {
      scheduleInjection(0)
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

export const setupNavigationListeners = () => {
  document.addEventListener('turbo:load', () => scheduleInjection())
  document.addEventListener('turbo:render', () => scheduleInjection())
  window.addEventListener('popstate', () => scheduleInjection())

  observeSidebar()
}
