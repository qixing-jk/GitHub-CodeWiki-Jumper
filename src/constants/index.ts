export const JUMPER_CONTAINER_ID = 'jumper-buttons-container'

// 类名里带构建哈希，且新旧格式拼接方式不同，这里只匹配 borderGrid 固定主干，不受哈希影响
export const SIDEBAR_SELECTOR = 'div[class*="borderGrid"]'
// 桌面侧边栏的第一个区块就是 About 区；页面还有页头和移动端的 About 副本，靠这个位置条件区分
export const INJECTION_SELECTOR = `${SIDEBAR_SELECTOR} > [class*="sidebarSection"]:first-child`
// Report 链接的路径是 GitHub 对外接口，比内部类名稳定
export const REPORT_LINK_SELECTOR = 'a[href*="/contact/report-content"]'
