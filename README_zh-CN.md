# GitHub CodeWiki & DeepWiki Jumper

[English](README.md) | 中文版

------

一个 Tampermonkey 用户脚本，在 GitHub 仓库页面添加了 “CodeWiki” 和 “DeepWiki” 按钮，让你一键跳转到对应的 Wiki 页面。

## 功能

- 在 GitHub 仓库页面添加 **CodeWiki** 和 **DeepWiki** 链接

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