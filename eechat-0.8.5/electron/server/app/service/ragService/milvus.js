const { Service } = require('egg')
const { DataType } = require('@zilliz/milvus2-sdk-node')

class MilvusService extends Service {
  constructor(ctx) {
    super(ctx)
    this.client = null
    this.collections = new Map() // 存储集合信息
    this.initialized = false
  }

  /**
   * 初始化Milvus客户端
   * @param {Object} config Milvus配置
   * @returns {Promise<Object>} 初始化结果
   */
  async initialize(config) {
    try {
      const { host, port, username, password } = config.milvus

      // 获取Milvus客户端
      const { MilvusClient } = require('@zilliz/milvus2-sdk-node')

      // 创建客户端连接
      const address = `${host}:${port}`
      const connectOptions = { address }

      // 如果提供了用户名和密码，添加到连接选项中
      if (username && password) {
        connectOptions.username = username
        connectOptions.password = password
      }

      this.client = new MilvusClient(connectOptions)
      this.initialized = true

      this.ctx.logger.info('Milvus客户端初始化成功:', { host, port })
      return { success: true }
    } catch (error) {
      this.ctx.logger.error('Milvus客户端初始化失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 确保服务已初始化
   * @param {Object} config 配置对象
   */
  async ensureInitialized(config) {
    if (!this.initialized) {
      await this.initialize(config)
    }
    return this.initialized
  }

  /**
   * 创建集合
   * @param {string} collectionName 集合名称
   * @param {number} dimension 向量维度
   * @param {Object} options 其他选项
   * @returns {Promise<Object>} 创建结果
   */
  async createCollection(collectionName, dimension, options = {}) {
    try {
      // 检查集合是否已存在
      const hasCollection = await this.hasCollection(collectionName)
      if (hasCollection) {
        this.ctx.logger.info(`集合 ${collectionName} 已存在`)
        return { success: true, exists: true }
      }

      // 定义集合字段
      const fields = [
        {
          name: 'id',
          description: '主键ID',
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true,
        },
        {
          name: 'document_id',
          description: '文档ID',
          data_type: DataType.VarChar,
          max_length: 100,
        },
        {
          name: 'text',
          description: '文本内容',
          data_type: DataType.VarChar,
          max_length: 65535,
        },
        {
          name: 'metadata',
          description: '元数据',
          data_type: DataType.VarChar,
          max_length: 1024,
        },
        {
          name: 'vector',
          description: '向量嵌入',
          data_type: DataType.FloatVector,
          dim: dimension,
        },
      ]

      // 创建集合
      await this.client.createCollection({
        collection_name: collectionName,
        fields,
        ...options,
      })

      // 创建索引
      await this.createIndex(collectionName, {
        field_name: 'vector',
        index_type: 'HNSW',
        metric_type: 'COSINE',
        params: { M: 8, efConstruction: 64 },
      })

      // 加载集合到内存
      await this.loadCollection(collectionName)

      this.ctx.logger.info(`集合 ${collectionName} 创建成功`)
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(`创建集合 ${collectionName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 检查集合是否存在
   * @param {string} collectionName 集合名称
   * @returns {Promise<boolean>} 是否存在
   */
  async hasCollection(collectionName) {
    try {
      const response = await this.client.hasCollection({
        collection_name: collectionName,
      })
      return response.value
    } catch (error) {
      this.ctx.logger.error(`检查集合 ${collectionName} 是否存在失败:`, error)
      return false
    }
  }

  /**
   * 创建索引
   * @param {string} collectionName 集合名称
   * @param {Object} indexParams 索引参数
   * @returns {Promise<Object>} 创建结果
   */
  async createIndex(collectionName, indexParams) {
    try {
      await this.client.createIndex({
        collection_name: collectionName,
        field_name: indexParams.field_name,
        extra_params: {
          index_type: indexParams.index_type,
          metric_type: indexParams.metric_type,
          params: JSON.stringify(indexParams.params),
        },
      })
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(`创建索引失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 加载集合到内存
   * @param {string} collectionName 集合名称
   * @returns {Promise<Object>} 加载结果
   */
  async loadCollection(collectionName) {
    try {
      await this.client.loadCollection({
        collection_name: collectionName,
      })
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(`加载集合 ${collectionName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 插入数据
   * @param {string} collectionName 集合名称
   * @param {Array<Object>} entities 实体数据
   * @returns {Promise<Object>} 插入结果
   */
  async insert(collectionName, entities) {
    try {
      // 准备数据
      const documentIds = entities.map(e => e.document_id)
      const texts = entities.map(e => e.text)
      const metadatas = entities.map(e => e.metadata)
      const vectors = entities.map(e => e.vector)

      // 插入数据
      const insertResult = await this.client.insert({
        collection_name: collectionName,
        fields_data: [
          {
            field_name: 'document_id',
            type: DataType.VarChar,
            data: documentIds,
          },
          { field_name: 'text', type: DataType.VarChar, data: texts },
          { field_name: 'metadata', type: DataType.VarChar, data: metadatas },
          { field_name: 'vector', type: DataType.FloatVector, data: vectors },
        ],
      })

      return {
        success: true,
        insertIds: insertResult.primary_keys,
        count: insertResult.primary_keys.length,
      }
    } catch (error) {
      this.ctx.logger.error(`插入数据到集合 ${collectionName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 搜索相似向量
   * @param {string} collectionName 集合名称
   * @param {Array<number>} vector 查询向量
   * @param {Object} options 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async search(collectionName, vector, options = {}) {
    try {
      const {
        topK = 10,
        outputFields = ['document_id', 'text', 'metadata'],
        filter = '',
      } = options

      // 执行搜索
      const searchResult = await this.client.search({
        collection_name: collectionName,
        vector: vector,
        filter: filter,
        limit: topK,
        output_fields: outputFields,
        search_params: {
          metric_type: 'COSINE',
          params: JSON.stringify({ ef: 64 }),
        },
      })

      // 处理结果
      const matches = searchResult.results.map(result => {
        const match = {
          id: result.id,
          score: result.score,
        }

        // 添加输出字段
        outputFields.forEach(field => {
          match[field] = result.entity[field]

          // 如果是元数据字段，尝试解析JSON
          if (
            field === 'metadata' &&
            typeof result.entity[field] === 'string'
          ) {
            try {
              match[field] = JSON.parse(result.entity[field])
            } catch (e) {
              // 如果解析失败，保持原始字符串
            }
          }
        })

        return match
      })

      return { success: true, matches }
    } catch (error) {
      this.ctx.logger.error(`搜索集合 ${collectionName} 失败:`, error)
      return { success: false, error: error.message || '未知错误', matches: [] }
    }
  }

  /**
   * 删除集合
   * @param {string} collectionName 集合名称
   * @returns {Promise<Object>} 删除结果
   */
  async dropCollection(collectionName) {
    try {
      await this.client.dropCollection({
        collection_name: collectionName,
      })
      return { success: true }
    } catch (error) {
      this.ctx.logger.error(`删除集合 ${collectionName} 失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 获取集合统计信息
   * @param {string} collectionName 集合名称
   * @returns {Promise<Object>} 统计信息
   */
  async getCollectionStats(collectionName) {
    try {
      const stats = await this.client.getCollectionStatistics({
        collection_name: collectionName,
      })
      return { success: true, stats: stats.stats }
    } catch (error) {
      this.ctx.logger.error(`获取集合 ${collectionName} 统计信息失败:`, error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 列出所有集合
   * @returns {Promise<Object>} 集合列表
   */
  async listCollections() {
    try {
      const response = await this.client.listCollections()
      return { success: true, collections: response.collection_names }
    } catch (error) {
      this.ctx.logger.error('获取集合列表失败:', error)
      return {
        success: false,
        error: error.message || '未知错误',
        collections: [],
      }
    }
  }
}

module.exports = MilvusService
