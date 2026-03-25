import { JUMPER_CONTAINER_ID, INJECTION_SELECTOR } from '@/constants'
import { addButtons } from './dom'

let injectTimer: ReturnType<typeof setTimeout> | undefined

const shouldInjectButtons = () => {
  return !!document.querySelector(INJECTION_SELECTOR) && !document.getElementById(JUMPER_CONTAINER_ID)
}

const scheduleInjection = (delay = 200) => {
  if (injectTimer) {
    clearTimeout(injectTimer)
  }

  injectTimer = setTimeout(() => {
    injectTimer = undefined
    if (shouldInjectButtons()) {
      addButtons()
    }
  }, delay)
}

const observeSidebar = () => {
  const observer = new MutationObserver(() => {
    if (shouldInjectButtons()) {
      scheduleInjection(0)
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

export const setupNavigationListeners = () => {
  const handleNavigation = () => {
    scheduleInjection()
  }

  document.addEventListener('turbo:load', handleNavigation)
  document.addEventListener('turbo:render', handleNavigation)
  document.addEventListener('pjax:end', handleNavigation)
  window.addEventListener('popstate', handleNavigation)

  observeSidebar()
  scheduleInjection(0)
}
