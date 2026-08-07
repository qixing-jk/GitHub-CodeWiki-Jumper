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

const getRepositoryNameFromPath = (): string | null => {
  const [owner, repository] = window.location.pathname.split('/').filter(Boolean)
  if (!owner || !repository) {
    return null
  }

  try {
    return normalizeRepositoryName(`${decodeURIComponent(owner)}/${decodeURIComponent(repository)}`)
  } catch {
    return null
  }
}

// 优先使用 GitHub 的语义元数据，缺失或无效时再回退到 URL 路径。
export const getRepositoryName = (): string | null => {
  const candidates = [
    document.querySelector('meta[name="current-repo-nwo"]')?.getAttribute('content'),
    document
      .querySelector('meta[name="octolytics-dimension-repository_nwo"]')
      ?.getAttribute('content'),
    getRepositoryNameFromPath(),
  ]

  for (const candidate of candidates) {
    const repositoryName = normalizeRepositoryName(candidate)
    if (repositoryName) {
      return repositoryName
    }
  }

  return null
}

export const buildRepositoryPath = (repositoryName: string): string | null => {
  const normalizedRepositoryName = normalizeRepositoryName(repositoryName)
  if (!normalizedRepositoryName) {
    return null
  }

  return `/${normalizedRepositoryName
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`
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
