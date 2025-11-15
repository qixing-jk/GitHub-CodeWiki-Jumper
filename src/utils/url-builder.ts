export const buildDeepWikiUrl = (pathname: string): string => {
  return `https://deepwiki.com${pathname}`
}

export const buildCodeWikiUrl = (hostname: string, pathname: string): string => {
  return `https://codewiki.google/${hostname}${pathname}`
}

export const buildZReadUrl = (pathname: string): string => {
  return `https://zread.ai${pathname}`
}
