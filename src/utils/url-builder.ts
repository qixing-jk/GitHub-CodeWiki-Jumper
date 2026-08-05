// 从 GitHub 页面的 meta 标签读取当前仓库名（owner/name）
export const getRepositoryName = (): string | null => {
  return (
    document.querySelector('meta[name="current-repo-nwo"]')?.getAttribute('content')?.trim() ||
    document.querySelector('meta[name="octolytics-dimension-repository_nwo"]')?.getAttribute('content')?.trim() ||
    null
  )
}

export const buildRepositoryPath = (repositoryName: string): string | null => {
  const parts = repositoryName.split('/')

  if (parts.length !== 2 || parts.some((part) => !part)) {
    return null
  }

  return `/${parts.map((part) => encodeURIComponent(part)).join('/')}`
}

export const buildDeepWikiUrl = (pathname: string): string => {
  return `https://deepwiki.com${pathname}`
}

export const buildCodeWikiUrl = (hostname: string, pathname: string): string => {
  return `https://codewiki.google/${hostname}${pathname}`
}

export const buildZReadUrl = (pathname: string): string => {
  return `https://zread.ai${pathname}`
}
