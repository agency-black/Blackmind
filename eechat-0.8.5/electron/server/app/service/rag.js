const { Service } = require('egg')
const fs = require('fs')
const path = require('path')
const ManagerService = require('./ragService/manager')

class RagService extends Service {
  constructor(ctx) {
    super(ctx)
    // this.ctx = ctx
    this.manager = new ManagerService(ctx)
  }
  /**
   * 获取配置
   */
  async getConfig() {
    try {
      // 配置文件路径
      const configFile = path.join(
        this.app.config.baseDir,
        'config/rag.config.json',
      )
      const defaultConfigFile = path.join(
        __dirname,
        './rag.config.default.json',
      )

      // 确保配置目录存在
      const configDir = path.dirname(configFile)
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }

      // 如果配置文件不存在，复制默认配置
      if (!fs.existsSync(configFile)) {
        this.ctx.logger.info('RAG配置文件不存在，创建默认配置')
        const defaultConfig = fs.readFileSync(defaultConfigFile, 'utf8')
        fs.writeFileSync(configFile, defaultConfig, 'utf8')
      }

      // 读取配置文件
      const config = fs.readFileSync(configFile, 'utf8')
      const configJSON = JSON.parse(config)

      return configJSON
    } catch (error) {
      this.ctx.logger.error('获取RAG配置失败:', error)
      throw error
    }
  }

  /**
   * 文档处理流程
   * @param {Object} document 文档对象
   * @param {Object} options 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async processDocument(document, options) {
    // 委托给RAG管理器处理
    return await this.manager.processDocumentRag(document, options)
  }

  /**
   * 查询处理
   * @param {string} query 查询文本
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async query(query, options = {}) {
    // 委托给RAG管理器处理
    return await this.ctx.service.rag.manager.query(query, options)
  }
}

module.exports = RagService
