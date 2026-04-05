const { Service } = require('egg');
const fs = require('fs');
const path = require('path');
const paths = require('../../config/paths');
const { SocksProxyAgent } = require('socks-proxy-agent');
const https = require('https');
const http = require('http');

class ProxyService extends Service {
  constructor(ctx) {
    super(ctx);
    this.proxyAgent = null;
    this.originalHttpsAgent = ORIGINAL_AGENTS.https;
    this.originalHttpAgent = ORIGINAL_AGENTS.http;
  }

  /**
   * 获取代理配置文件路径
   */
  getConfigFilePath() {
    return path.join(paths.configPath, 'proxy.config.json');
  }

  /**
   * 获取代理配置
   */
  async getProxyConfig() {
    try {
      const configFile = this.getConfigFilePath();
      
      // 如果配置文件不存在，返回默认配置
      if (!fs.existsSync(configFile)) {
        return {
          enabled: false,
          host: '127.0.0.1',
          port: 7897,
          username: '',
          password: ''
        };
      }

      // 读取配置文件
      const configContent = fs.readFileSync(configFile, 'utf8');
      const config = JSON.parse(configContent);
      
      return config;
    } catch (error) {
      this.ctx.logger.error('获取代理配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存代理配置
   */
  async saveProxyConfig(config) {
    try {
      // 确保配置目录存在
      if (!fs.existsSync(paths.configPath)) {
        fs.mkdirSync(paths.configPath, { recursive: true });
      }

      const configFile = this.getConfigFilePath();
      
      // 写入配置文件
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
      
      return { success: true };
    } catch (error) {
      this.ctx.logger.error('保存代理配置失败:', error);
      throw error;
    }
  }

  /**
   * 创建SOCKS代理Agent
   */
  createProxyAgent(config) {
    try {
      let proxyUrl;
      
      if (config.username && config.password) {
        proxyUrl = `socks5://${config.username}:${config.password}@${config.host}:${config.port}`;
      } else {
        proxyUrl = `socks5://${config.host}:${config.port}`;
      }

      return new SocksProxyAgent(proxyUrl);
    } catch (error) {
      this.ctx.logger.error('创建代理Agent失败:', error);
      throw error;
    }
  }

  /**
   * 应用代理设置
   */
  async applyProxySettings(config) {
    try {
      if (config.enabled) {
        // 创建代理agent
        this.proxyAgent = this.createProxyAgent(config);
        
        // 设置全局代理
        https.globalAgent = this.proxyAgent;
        http.globalAgent = this.proxyAgent;

        https.get('https://ipinfo.io', (res) => {
          console.log(res.headers);
          res.pipe(process.stdout);
        });
        
        this.ctx.logger.info('SOCKS代理设置已应用:', {
          host: config.host,
          port: config.port
        });
      } else {
        // 恢复原始agent
        https.globalAgent = this.originalHttpsAgent;
        http.globalAgent = this.originalHttpAgent;
        this.proxyAgent = null;
        
        this.ctx.logger.info('代理已禁用');
      }
      
      return { success: true };
    } catch (error) {
      this.ctx.logger.error('应用代理设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新代理配置
   */
  async updateProxyConfig(proxyConfig) {
    try {
      // 获取当前配置
      const currentConfig = await this.getProxyConfig();
      
      // 合并新配置
      const newConfig = {
        ...currentConfig,
        ...proxyConfig
      };
      
      // 保存配置
      await this.saveProxyConfig(newConfig);
      
      // 立即应用新配置
      await this.applyProxySettings(newConfig);
      
      return {
        success: true,
        config: newConfig
      };
    } catch (error) {
      this.ctx.logger.error('更新代理配置失败:', error);
      throw error;
    }
  }

  /**
   * 启用代理
   */
  async enableProxy() {
    try {
      const config = await this.getProxyConfig();
      config.enabled = true;
      
      await this.applyProxySettings(config);
      await this.saveProxyConfig(config);
      
      return {
        success: true,
        message: '代理已启用',
        config
      };
    } catch (error) {
      this.ctx.logger.error('启用代理失败:', error);
      throw error;
    }
  }

  /**
   * 禁用代理
   */
  async disableProxy() {
    try {
      const config = await this.getProxyConfig();
      config.enabled = false;
      
      await this.applyProxySettings(config);
      await this.saveProxyConfig(config);
      
      return {
        success: true,
        message: '代理已禁用',
        config
      };
    } catch (error) {
      this.ctx.logger.error('禁用代理失败:', error);
      throw error;
    }
  }

  /**
   * 测试代理连接
   */
  async testProxy(config = null) {
    try {
      const testConfig = config || await this.getProxyConfig();
      
      if (!testConfig.enabled) {
        return { success: false, message: '代理未启用' };
      }

      const agent = this.createProxyAgent(testConfig);
      
      return {
        success: true,
        message: 'SOCKS代理连接测试成功'
      };
    } catch (error) {
      this.ctx.logger.error('代理测试失败:', error);
      return {
        success: false,
        message: `代理测试失败: ${error.message}`
      };
    }
  }
}

module.exports = ProxyService;