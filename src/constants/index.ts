export const JUMPER_CONTAINER_ID = 'jumper-buttons-container'
// GitHub 新版仓库侧边栏容器
export const SIDEBAR_SELECTOR = 'div[class*="CodeViewSidebar-module__borderGrid"]'
// About 是桌面侧边栏的首个区块；响应式类名会变化，页面外另有移动端副本。
export const INJECTION_SELECTOR = `${SIDEBAR_SELECTOR} > [class*="SidebarSection-module__sidebarSection"]:first-child`
