import { addButtons } from './dom'

const handleNavigation = () => {
  setTimeout(addButtons, 500)
}

export const setupNavigationListeners = () => {
  const originalPushState = history.pushState
  history.pushState = function (...args) {
    originalPushState.apply(this, args)
    handleNavigation()
  }

  const originalReplaceState = history.replaceState
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args)
    handleNavigation()
  }

  window.addEventListener('popstate', handleNavigation)
}
