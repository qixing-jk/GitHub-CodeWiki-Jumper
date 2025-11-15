import { defineConfig } from 'vite'
import monkey, { util } from 'vite-plugin-monkey'
import AutoImport from 'unplugin-auto-import/vite'
import pkg from './package.json'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    AutoImport({
      imports: [util.unimportPreset],
    }),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: {
          '': 'github-codewiki-jumper',
          'zh-CN': 'GitHub 代码百科跳转助手',
        },
        namespace: 'https://github.com/qixing-jk/github-codewiki-jumper',
        version: pkg.version,
        description: {
          '': 'One click jump from GitHub to CodeWiki, DeepWiki and Zread',
          'zh-CN': '一键从 GitHub仓库 跳转到 CodeWiki, DeepWiki 和 Zread',
        },
        match: ['https://github.com/*/*'],
        author: 'qixing-jk',
        updateURL: `https://raw.githubusercontent.com/qixing-jk/github-codewiki-jumper/main/dist/${pkg.name}.user.js`,
        downloadURL: `https://raw.githubusercontent.com/qixing-jk/github-codewiki-jumper/main/dist/${pkg.name}.user.js`,
      },
      build: {
        fileName: `${pkg.name}.user.js`,
      },
    }),
  ],
})
