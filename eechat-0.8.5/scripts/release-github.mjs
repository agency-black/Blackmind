// GitHub Release 发布脚本
// 使用方法: node scripts/release-github.mjs [--draft] [--pre-release]
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// 获取当前脚本的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 读取 package.json 获取版本信息
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;
const appName = packageJson.name;

// 检查 GH_TOKEN 环境变量
if (!process.env.GH_TOKEN) {
  console.error('❌ 错误: 未设置 GH_TOKEN 环境变量');
  console.error('请设置 GitHub 个人访问令牌: export GH_TOKEN=your_token');
  process.exit(1);
}

// 解析命令行参数
const args = process.argv.slice(2);
const isDraft = args.includes('--draft');
const isPreRelease = args.includes('--pre-release');

// 获取 release 目录中的文件
const releaseDir = path.join(rootDir, 'release', version);

// 检查 release 目录是否存在
if (!fs.existsSync(releaseDir)) {
  console.error(`❌ 错误: release/${version} 目录不存在`);
  console.error('请先构建应用: npm run build');
  process.exit(1);
}

// === 支持的文件扩展名 ===
const allowedExts = ['.exe', '.dmg', '.zip', '.yml', '.blockmap'];

// 获取发布文件列表
const getAssetFiles = async () => {
  // 使用 Set 来避免重复文件
  const fileSet = new Set();
  
  // 使用 glob 查找所有平台的安装包文件
  const patterns = [
    // Windows 文件
    `${releaseDir}/*-windows-*.exe`,
    `${releaseDir}/*-windows-*.exe.blockmap`,
    // Mac 文件
    `${releaseDir}/*-mac-*.dmg`,
    `${releaseDir}/*-mac-*.dmg.blockmap`,
    `${releaseDir}/*-mac-*.zip`,
    `${releaseDir}/*-mac-*.zip.blockmap`,
    // 通用文件
    `${releaseDir}/*.yml`,
    // 根目录下的 yml 文件
    `${rootDir}/release/*.yml`
  ];
  
  try {
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      for (const file of matches) {
        const ext = path.extname(file);
        const filename = path.basename(file).toLowerCase();
        
        // 过滤文件：必须是允许的扩展名且不包含 debug
        if (allowedExts.includes(ext) && !filename.includes('debug')) {
          fileSet.add(file);
        }
      }
    }
  } catch (error) {
    console.error('❌ 查找文件时出错:', error);
  }
  
  // 转换回数组
  const files = Array.from(fileSet);
  
  // 打印找到的文件
  console.log(`🔍 找到 ${files.length} 个文件:`);
  files.forEach(file => console.log(`   - ${path.basename(file)}`));
  
  return files;
};

// 创建 Release 说明
const generateReleaseNotes = () => {
  try {
    // 尝试从 CHANGELOG.md 获取最新版本的更新说明
    if (fs.existsSync(path.join(rootDir, 'CHANGELOG.md'))) {
      const changelog = fs.readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf8');
      const versionSection = changelog.match(new RegExp(`## \\[${version}\\]([\\s\\S]*?)(?=## \\[|$)`, 'm'));
      
      if (versionSection && versionSection[1]) {
        return versionSection[1].trim();
      }
    }
  } catch (error) {
    console.warn('⚠️ 无法从 CHANGELOG.md 获取更新说明:', error.message);
  }
  
  // 默认更新说明
  return `${appName} v${version}`;
};

// 创建 GitHub Release
const createRelease = async () => {
  try {
    const assets = await getAssetFiles();
    
    if (assets.length === 0) {
      console.error('❌ 错误: 没有找到可发布的文件');
      process.exit(1);
    }
    
    console.log(`📦 准备发布 ${appName} v${version}`);
    
    // 创建 release 标签
    const tagName = `v${version}`;
    console.log(`🏷️  创建标签: ${tagName}`);
    
    try {
      execSync(`git tag -d ${tagName}`, { stdio: 'ignore' });
    } catch (e) {
      // 标签不存在，忽略错误
    }
    
    execSync(`git tag ${tagName}`);
    execSync(`git push github ${tagName} --force`);
    
    // 准备 release 参数
    const releaseNotes = generateReleaseNotes();
    
    // 检查 release 是否已存在
    let releaseExists = false;
    try {
      const result = execSync(`gh release view ${tagName} --json name`, { stdio: 'pipe' });
      releaseExists = result.toString().trim().length > 0;
    } catch (e) {
      // release 不存在，忽略错误
    }
    
    // 构建命令
    let command = '';
    if (releaseExists) {
      console.log(`📝 发现已存在的 release: ${tagName}，将进行更新`);
      command = `gh release upload ${tagName}`;
      
      // 删除现有资源文件（可选）
      try {
        execSync(`gh release delete-asset ${tagName} --pattern "*" --yes`, { stdio: 'ignore' });
        console.log('🗑️  已删除现有资源文件');
      } catch (e) {
        console.warn('⚠️ 删除现有资源文件失败，将直接添加新文件');
      }
    } else {
      command = `gh release create ${tagName}`;
      
      // 添加名称
      command += ` --title "${appName} v${version}"`;
      
      // 添加说明
      command += ` --notes "${releaseNotes.replace(/"/g, '\\"')}"`;
      
      // 添加草稿和预发布选项
      if (isDraft) command += ' --draft';
      if (isPreRelease) command += ' --prerelease';
    }
    
    // 添加资源文件
    assets.forEach(file => {
      command += ` "${file}"`;
    });
    
    console.log('🚀 执行发布命令...');
    console.log(`命令: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${appName} v${version} 发布成功!`);
  } catch (error) {
    console.error('❌ 发布失败:', error.message);
    process.exit(1);
  }
};

createRelease();