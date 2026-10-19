const normalizeRepositoryName = (value: string | null | undefined): string | null => {
  const parts = value
    ?.trim()
    .split('/')
    .map((part) => part.trim())

  if (!parts || parts.length !== 2 || parts.some((part) => !part)) {
    return null
  }

  return parts.join('/')
}

// 仓库页都带有这个 meta 标签，从 URL 解析反而要处理编码和非法路径等边界情况
export const getRepositoryName = (): string | null => {
  return normalizeRepositoryName(
    document
      .querySelector('meta[name="octolytics-dimension-repository_nwo"]')
      ?.getAttribute('content')
  )
}

// 入参已由 getRepositoryName 保证 owner/repo 格式
export const buildRepositoryPath = (repositoryName: string): string => {
  return `/${repositoryName.split('/').map(encodeURIComponent).join('/')}`
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
