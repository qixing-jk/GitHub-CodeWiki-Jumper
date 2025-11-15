# GitHub CodeWiki & DeepWiki Jumper

A Tampermonkey userscript that adds "CodeWiki" and "DeepWiki" buttons to GitHub repository pages, allowing for a one-click jump to the corresponding wiki pages.

## Features

- Add **CodeWiki** and **DeepWiki** links to the GitHub repository page

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