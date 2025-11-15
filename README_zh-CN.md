# GitHub 代码百科跳转助手

[English](README.md) | 中文版

------

[GitHub](https://github.com/qixing-jk/github-deepwiki-jumper) |
[Greasyfork](https://greasyfork.org/scripts/555942)

![Greasy Fork 版本](https://img.shields.io/greasyfork/v/555942)
![Greasy Fork 下载量](https://img.shields.io/greasyfork/dt/555942)

一个用户脚本，通过添加指向流行代码智能平台的直接跳转链接来增强 GitHub 仓库。该脚本无缝集成到 GitHub UI 中，提供对 **CodeWiki**、**DeepWiki** 和 **Zread** 的快速访问，从而简化您的代码探索和研究过程。

## 功能

- 一键从 GitHub仓库 跳转到 [CodeWiki](https://codewiki.google), [DeepWiki](https://deepwiki.com/) 和 [Zread](https://zread.ai/)

## 安装

1.  安装一个用户脚本管理器，如 [Tampermonkey](https://www.tampermonkey.net/)。
2.  从 [GitHub Releases](https://github.com/qixing-jk/github-deepwiki-jumper/releases) 页面安装脚本。

## 开发

1.  克隆仓库。
2.  使用 `pnpm install` 安装依赖。
3.  使用 `pnpm run dev` 运行开发服务器。
4.  脚本将在 `http://localhost:5173/dist/github-codewiki-jumper.user.js` 可用。在你的用户脚本管理器中安装它。

## 构建

- `pnpm run build`: 构建用于生产环境的用户脚本。