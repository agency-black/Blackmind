// ⚠️ Node 14+，执行前：npm install ssh2 glob
import { Client } from 'ssh2';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

// === 自动获取版本号 ===
const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'));
const version = pkg.version;

// === 上传配置 ===
const config = {
  localReleaseDir: path.resolve('./release'),
  version: version,
  remoteHost: '8.130.172.245',               // ← 修改为你的服务器 IP / 域名
  remoteUser: 'root',                         // ← 修改为你的远程用户名
  remotePath: '/var/www/eechat-update/',
  privateKey: fs.readFileSync(process.env.SSH_KEY || path.resolve(process.env.HOME, '.ssh/id_rsa'))
};

// === 支持的文件扩展名 ===
const allowedExts = ['.exe', '.dmg', '.zip', '.yml', '.blockmap'];

const uploadFiles = async () => {
  const conn = new Client();
  const versionDir = path.join(config.localReleaseDir, config.version);

  const allFiles = [
    ...(await glob(`${versionDir}/**/*`, {
      nodir: true,
      ignore: [`**/win-unpacked/**`, `**/mac-arm64/**`],
    })),
    ...(await glob(`${config.localReleaseDir}/*.yml`, { nodir: true })),
  ]
  
  const files = allFiles.filter(file => {
    const ext = path.extname(file);
    const filename = path.basename(file).toLowerCase();
    return allowedExts.includes(ext) && !filename.includes('debug');
  });

  if (files.length === 0) {
    console.log('⚠️ 没有匹配的更新文件可上传。');
    return;
  }

  console.log(`📦 将上传 ${files.length} 个文件...`);

  return new Promise((resolve, reject) => {
    conn
      .on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);

          let uploaded = 0;
          files.forEach(file => {
            const filename = path.basename(file);
            const remote = path.posix.join(config.remotePath, filename);
            const readStream = fs.createReadStream(file);
            const writeStream = sftp.createWriteStream(remote);

            writeStream.on('close', () => {
              console.log(`✅ 已上传: ${filename}`);
              uploaded++;
              if (uploaded === files.length) {
                conn.end();
                resolve();
              }
            });

            readStream.pipe(writeStream);
          });
        });
      })
      .connect({
        host: config.remoteHost,
        port: 22,
        username: config.remoteUser,
        privateKey: config.privateKey
      });
  });
};

uploadFiles()
  .then(() => console.log('🚀 所有文件上传完成！'))
  .catch(err => console.error('❌ 上传失败:', err));
