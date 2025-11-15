# GitHub CodeWiki, DeepWiki & Zread Jumper

English | [中文版](README_zh-CN.md)

------

[GitHub](https://github.com/qixing-jk/github-deepwiki-jumper) |
[Greasyfork](https://greasyfork.org/scripts/555942)

![Greasy Fork Version](https://img.shields.io/greasyfork/v/555942)
![Greasy Fork Downloads](https://img.shields.io/greasyfork/dt/555942)

A userscript that enhances GitHub repositories by adding direct jump links to popular code intelligence platforms. This script integrates seamlessly into the GitHub UI, providing quick access to **CodeWiki**, **DeepWiki**, and **Zread**, streamlining your code exploration and research process.

## Features

- One-click jump from a GitHub repository to [CodeWiki](https://codewiki.google), [DeepWiki](https://deepwiki.com/), and [Zread](https://zread.ai/)

## Installation

1.  Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/).
2.  Install the script from the [GitHub Releases](https://github.com/qixing-jk/github-deepwiki-jumper/releases) page.

## Development

1.  Clone the repository.
2.  Install dependencies with `pnpm install`.
3.  Run the development server with `pnpm run dev`.
4.  The script will be available at `http://localhost:5173/dist/github-codewiki-jumper.user.js`. Install it in your userscript manager.

## Building

- `pnpm run build`: Builds the userscript for production.