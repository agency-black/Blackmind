const { Service } = require('egg')
const fs = require('fs')
const path = require('path')
const lancedb = require('@lancedb/lancedb')
const paths = require('../../../config/paths')
const nanoid = require('nanoid')

// 使用全局状态管理 LanceDB 连接
const globalState = {
  db: null,
  dbPath: null,
  initialized: false,
}

class LanceDbService extends Service {
  constructor(ctx) {
    super(ctx)
    // 不再使用实例变量
  }

  /**
   * 初始化LanceDB客户端
   * @param {Object} config LanceDB配置
   * @returns {Promise<Object>} 初始化结果
   */
  async initialize(config) {
    try {
      // 如果已经初始化，则直接返回
      if (globalState.initialized) {
        return { success: true }
      }

      // 获取数据库存储路径
      globalState.dbPath = path.join(
        path.dirname(paths.databasePath),
        'lancedb',
      )

      // 确保目录存在
      if (!fs.existsSync(globalState.dbPath)) {
        fs.mkdirSync(globalState.dbPath, { recursive: true })
      }

      // 连接到数据库
      globalState.db = await lancedb.connect(globalState.dbPath)
      globalState.initialized = true

      this.ctx.logger.info('LanceDB客户端初始化成功:', {
        path: globalState.dbPath,
      })

      return { success: true }
    } catch (error) {
      this.ctx.logger.error('LanceDB客户端初始化失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 确保服务已初始化
   * @param {Object} config 配置对象
   */
  async ensureInitialized(config) {
    if (!globalState.initialized) {
      await this.initialize(config)
    }
    return globalState.initialized
  }

  /**
   * 创建表
   * @param {string} tableName 表名称
   * @param {number} dimension 向量维度
   * @param {Object} options 其他选项
   * @returns {Promise<Object>} 创建结果
   */
  async createTable(tableName, dimension, options = {}) {
    try {
      // 检查表是否已存在
      const hasTable = await this.hasTable(tableName)
      if (hasTable) {
        this.ctx.logger.info(`表 ${tableName} 已存在`)
        return { success: true, exists: true }
      }

      // 创建一个示例数据
      const sampleData = [
        {
          id: 'sample_id',
          document_id: 'sample_doc_id',
          text: 'sample text',
          metadata: '{}',
          vector: new Array(Number(dimension)).fill(0),
        },
      ]

      // 使用示例数据创建表
      await globalState.db.createTable(tableName, sampleData)

      this.ctx.logger.info(`表 ${tableName} 创建成功`)
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(`创建表 ${tableName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 检查表是否存在
   * @param {string} tableName 表名称
   * @returns {Promise<boolean>} 是否存在
   */
  async hasTable(tableName) {
    try {
      const tables = await globalState.db.tableNames()
      return tables.includes(tableName)
    } catch (error) {
      this.ctx.logger.error(`检查表 ${tableName} 是否存在失败:`, error)
      return false
    }
  }

  /**
   * 插入数据
   * @param {string} tableName 表名称
   * @param {Array<Object>} entities 实体数据
   * @returns {Promise<Object>} 插入结果
   */
  async insert(tableName, entities) {
    try {
      // 获取表
      const table = await globalState.db.openTable(tableName)
      console.log(await table.schema())

      // 准备数据 - 确保字段名与表结构完全匹配
      const data = entities.map((e, index) => ({
        id: `${e.document_id}_${index}_${nanoid.nanoid(10)}`,
        document_id: e.document_id,
        text: e.text,
        metadata:
          typeof e.metadata === 'string'
            ? e.metadata
            : JSON.stringify(e.metadata),
        vector: e.vector,
      }))

      // 插入数据
      await table.add(data)
      const results = await table.query().limit(10).toArray();
      console.log(JSON.parse(JSON.stringify(results)));
      // this.ctx.logger.info(`插入数据到表 ${tableName} 成功`)

      return {
        success: true,
        count: data.length,
      }
    } catch (error) {
      this.ctx.logger.error(`插入数据到表 ${tableName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 搜索相似向量
   * @param {string} tableName 表名称
   * @param {Array<number>} vector 查询向量
   * @param {Object} options 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async search(tableName, vector, options = {}) {
    try {
      const {
        topK = 3,
        outputFields = ['document_id', 'text', 'metadata'],
        filter = '',
      } = options

      // 获取表
      const table = await globalState.db.openTable(tableName)

      const schema = await table.schema()

      const matches = await table.vectorSearch(vector).distanceType("cosine")
      .limit(options.topK)
      .toArray();

      const plainResults = JSON.parse(JSON.stringify(matches));

      // 构建查询
      // let query = table.search(vector)

      // // 添加过滤条件
      // if (filter) {
      //   query = query.where(filter)
      // }

      // // 执行搜索
      // const results = await query
      //   .limit(topK)
      //   .select(['id', ...outputFields])
      //   .toArray()

      // 处理结果
      // const matches = results.map(result => {
      //   const match = {
      //     id: result.id,
      //     score: result.score,
      //   }

      //   // 添加输出字段
      //   outputFields.forEach(field => {
      //     match[field] = result[field]

      //     // 如果是元数据字段，尝试解析JSON
      //     if (field === 'metadata' && typeof result[field] === 'string') {
      //       try {
      //         match[field] = JSON.parse(result[field])
      //       } catch (e) {
      //         // 如果解析失败，保持原始字符串
      //       }
      //     }
      //   })

      //   return match
      // })

      return { success: true, matches: plainResults }
    } catch (error) {
      this.ctx.logger.error(`搜索表 ${tableName} 失败:`, error)
      return { success: false, error: error.message || '未知错误', matches: [] }
    }
  }

  /**
   * 删除表
   * @param {string} tableName 表名称
   * @returns {Promise<Object>} 删除结果
   */
  async dropTable(tableName) {
    try {
      // 检查表是否存在
      const hasTable = await this.hasTable(tableName)
      if (!hasTable) {
        this.ctx.logger.info(`表 ${tableName} 不存在，无需删除`)
        return { success: true, notExists: true }
      }

      await globalState.db.dropTable(tableName)
      this.ctx.logger.info(`表 ${tableName} 删除成功`)
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(`删除表 ${tableName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 获取表统计信息
   * @param {string} tableName 表名称
   * @returns {Promise<Object>} 统计信息
   */
  async getTableStats(tableName) {
    try {
      const table = await globalState.db.openTable(tableName)
      const stats = await table.countRows()
      return { success: true, stats: { row_count: stats } }
    } catch (error) {
      this.ctx.logger.error(`获取表 ${tableName} 统计信息失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 列出所有表
   * @returns {Promise<Object>} 表列表
   */
  async listTables() {
    try {
      const tables = await globalState.db.tableNames()
      return { success: true, tables }
    } catch (error) {
      this.ctx.logger.error('获取表列表失败:', error)
      return {
        success: false,
        error: error.message || '未知错误',
        tables: [],
      }
    }
  }

  /**
   * 删除文档
   * @param {string} tableName 表名称
   * @param {string} documentId 文档ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteDocument(tableName, documentId) {
    try {
      const table = await globalState.db.openTable(tableName)
      await table.delete(`document_id = '${documentId}'`)
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(
        `从表 ${tableName} 删除文档 ${documentId} 失败:`,
        error,
      )
      return { success: false, error: error.message || '未知错误' }
    }
  }

  
  /**
   * 获取表中的所有记录
   * @param {string} tableName 表名称
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getAllRecords(tableName, options = {}) {
    try {
      const {limit, outputFields, filter} = options

      // 获取表
      const table = await globalState.db.openTable(tableName)
      const matches = await table.query()
      .select([...outputFields])
      .filter(filter)
      .limit(limit)
      .toArray()

      return { success: true, matches }
    } catch (error) {
      this.ctx.logger.error(`获取表 ${tableName} 所有记录失败:`, error)
      return { success: false, error: error.message || '未知错误', matches: [] }
    }
  }
}

module.exports = LanceDbService
