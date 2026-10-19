# GitHub CodeWiki, DeepWiki & Zread Jumper

English | [中文版](README_zh-CN.md)

---

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

## Local authenticated checks

Use your selected, already signed-in browser through CDP or a Playwright extension session. No local agent skill is required. Browser startup, profiles, and login stay outside this project.

For CDP, supply the browser's debugging endpoint:

```sh
pnpm test:authenticated --own YOUR_LOGIN/nonempty-repo --cdp http://127.0.0.1:YOUR_PORT
```

For the extension, use an already connected [Playwright CLI](https://github.com/microsoft/playwright-cli) session. Generate the check file, then run the printed `run-code --filename` command, replacing `YOUR_SESSION` with your session name:

```sh
pnpm test:authenticated --own YOUR_LOGIN/nonempty-repo --extension-script
```

Both paths run the same checks, create and close their own test tab, and preserve existing browser tabs. Verify the selected browser and disable any installed copy of this userscript. Checks verify the GitHub login against the owner of `--own`, or an explicit `--account LOGIN`.

Checks cover your repository, another user's `microsoft/playwright`, About placement, all three links, file navigation, back/forward, and narrow screens. Choose an `--own` repository containing files. Use `--other OWNER/REPO` to change the other-user repository, or `--fork`, `--empty`, and `--private` to supply corresponding repositories you own. Missing or uncovered scenarios are **skipped**, not passed. API `size: 0` does not mean a repository has no files.

The command typechecks and builds current source in a temporary directory, preserving the release bundle. CDP writes `report.json` and exits with code 1 on failure. The extension path returns result JSON through Playwright CLI; inspect each result's `status`. Both paths attempt to capture screenshots for failed scenarios. Use `--output PATH` to choose the output directory, and keep private-repository reports and screenshots local. `pnpm test:tooling` validates the runner against simulated pages without a GitHub login. Authenticated checks are not added to CI.
