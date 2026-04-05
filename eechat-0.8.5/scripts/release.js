#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
)
const version = pkg.version
const releaseDir = join(__dirname, '..', 'release', version)

// 定义各平台的预构建目录（可根据你实际的输出目录结构调整）
const platforms = [
  { name: 'mac', dir: join(releaseDir, 'mac') },
  { name: 'win', dir: join(releaseDir, 'win') },
  { name: 'linux', dir: join(releaseDir, 'linux') },
]

// platforms.forEach(({ name, dir }) => {
//   if (existsSync(dir)) {
//     console.log(`Publishing ${name} artifacts from ${dir} ...`)
    try {
      // 调用 electron-builder 进行发布，使用 --prepackaged 指定预构建目录
      // 注意这里使用 npx，如果你已全局安装 electron-builder，也可以直接调用 electron-builder
      execSync(`npx electron-builder --publish=onTag --prepackaged release/${version}`, {
        stdio: 'inherit',
      })
      console.log(`发布完成！`)
    } catch (error) {
      console.error(`发布失败：`, error)
    }
//   } else {
//     console.warn(`Warning: ${dir} 不存在，跳过 ${name} 的发布。`)
//   }
// })
