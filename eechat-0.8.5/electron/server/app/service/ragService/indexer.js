const { Service } = require('egg')
const LanceDbService = require('./lancedb')
class IndexerService extends Service {
  constructor(ctx) {
    super(ctx)
    this.lancedb = new LanceDbService(ctx)
  }

  /**
   * 索引文档
   * @param {Object} document 文档对象
   * @param {Array<string>} chunks 文本块
   * @param {Array<Array<number>>} embeddings 嵌入向量
   * @param {Object} options 选项
   * @returns {Promise<Object>} 索引结果
   */
  async indexDocument(document, chunks, embeddings, options = {}) {
    const { collection = 'documents' } = options

    try {
      // 获取LanceDB服务
      const lancedbService = this.lancedb
      const config = await this.ctx.service.rag.getConfig()

      // 确保LanceDB已初始化
      await lancedbService.ensureInitialized(config)

      // 确保表存在
      const dimension = config.embedding.dimension
      await lancedbService.createTable(collection, dimension)
      // 构建实体数据
      const entities = chunks.map((chunk, index) => ({
        document_id: document.id,
        text: chunk,
        vector: embeddings[index],
        metadata: JSON.stringify({
          chunk_index: index,
          document_id: document.id,
          title: document.title || '',
          source: document.source || '',
          created_at: document.created_at || new Date().toISOString(),
        }),
      }))

      // 插入数据
      const result = await lancedbService.insert(collection, entities)

      this.ctx.logger.info('文档索引完成:', {
        documentId: document.id,
        collection,
        chunks: chunks.length,
      })

      return {
        success: result.success,
        documentId: document.id,
        chunks: chunks.length,
        collection,
      }
    } catch (error) {
      this.ctx.logger.error('文档索引失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 搜索文档
   * @param {Array<number>} queryVector 查询向量
   * @param {Object} options 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async search(queryVector, options = {}) {
    const { collection = 'documents', topK = 10, filter = '' } = options

    try {
      // 获取LanceDB服务
      const lancedbService = this.lancedb

      // 执行搜索
      const result = await lancedbService.search(collection, queryVector, {
        topK,
        filter,
        // outputFields: ['document_id', 'text', 'metadata'],
      })

      return result
    } catch (error) {
      this.ctx.logger.error('搜索失败:', error)
      return { success: false, error: error.message || '未知错误', matches: [] }
    }
  }

  /**
   * 删除文档
   * @param {string} documentId 文档ID
   * @param {Object} options 选项
   * @returns {Promise<Object>} 删除结果
   */
  async deleteDocument(documentId, options = {}) {
    const { collection = 'documents' } = options

    try {
      // 获取LanceDB服务
      const lancedbService = this.lancedb

      // 执行删除
      await lancedbService.deleteDocument(collection, documentId)

      this.ctx.logger.info('文档删除成功:', { documentId, collection })
      return { success: true, documentId }
    } catch (error) {
      this.ctx.logger.error('文档删除失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }
}

module.exports = IndexerService
