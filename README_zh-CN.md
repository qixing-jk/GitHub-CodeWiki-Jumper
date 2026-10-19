# GitHub 代码百科跳转助手

[English](README.md) | 中文版

---

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

## 本地登录态验收

可使用自行选择并已登录的浏览器，通过 CDP 或 Playwright extension 会话验收。不依赖本地 Agent skill，也不管理浏览器启动、配置目录或登录。

CDP 直接传入浏览器的调试地址：

```sh
pnpm test:authenticated --own YOUR_LOGIN/nonempty-repo --cdp http://127.0.0.1:YOUR_PORT
```

extension 使用 [Playwright CLI](https://github.com/microsoft/playwright-cli) 已连接的会话。先生成验收文件，再执行终端打印的 `run-code --filename` 命令，将 `YOUR_SESSION` 替换为你的会话名：

```sh
pnpm test:authenticated --own YOUR_LOGIN/nonempty-repo --extension-script
```

两种方式执行相同的检查，只创建和关闭验收标签页，保留原浏览器及已有标签页。请确认选中了预期浏览器，并停用已安装的同名用户脚本。验收会核对 GitHub 登录账号，默认为 `--own` 的所有者，也可用 `--account LOGIN` 指定。

默认检查自己的仓库、他人的 `microsoft/playwright`、About 注入位置、三条链接、文件页往返、前进后退和窄屏状态。`--own` 请选择有文件的仓库；可用 `--other OWNER/REPO` 替换他人仓库，用 `--fork`、`--empty`、`--private` 指定自己拥有的对应仓库。未提供或无法覆盖的场景明确标为 **skipped**，不算通过。API 返回 `size: 0` 不代表仓库没有文件。

命令会检查 TypeScript，并将当前源码构建到临时目录，保留 release bundle。CDP 模式保存 `report.json`，失败时退出码为 1；extension 模式由 Playwright CLI 输出结果 JSON，请检查每项的 `status`。两种模式都会尝试为失败场景保存截图，可用 `--output PATH` 指定输出目录。私有仓库的报告和截图请留在本地。`pnpm test:tooling` 可在无需登录的模拟页面上验证验收入口，登录态验收不加入 CI。
