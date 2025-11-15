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
        name: 'github-codewiki-jumper',
        namespace: 'https://github.com/qixing-jk/github-codewiki-jumper',
        match: ['https://github.com/*/*'],
        version: pkg.version,
        author: 'qixing-jk',
        description: 'One click jump from GitHub to CodeWiki & DeepWiki',
        updateURL: `https://raw.githubusercontent.com/qixing-jk/github-codewiki-jumper/main/dist/${pkg.name}.user.js`,
        downloadURL: `https://raw.githubusercontent.com/qixing-jk/github-codewiki-jumper/main/dist/${pkg.name}.user.js`,
      },
      build: {
        fileName: `${pkg.name}.user.js`,
      },
    }),
  ],
})
