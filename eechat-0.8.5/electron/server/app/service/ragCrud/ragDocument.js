const { Service } = require('egg')
const fs = require('fs').promises
const path = require('path')

class RagDocumentService extends Service {
  /**
   * 创建文档
   * @param {Object} data 文档数据
   * @param {number} ragBaseId 知识库ID
   * @returns {Promise<Object>} 创建结果
   */
  async create(data, ragBaseId) {
    const { ctx } = this
    try {
      // 确保必填字段
      if (!data.title) {
        data.title = '未命名文档'
      }

      // 设置知识库ID
      if (!ragBaseId) {
        return { success: false, error: '知识库ID不能为空' }
      }
      data.rag_base_id = ragBaseId

      // 获取知识库信息
      const ragBase = await ctx.model.RagBase.findByPk(ragBaseId)
      if (!ragBase) {
        return { success: false, error: '知识库不存在' }
      }

      // 设置初始状态
      data.status = 'pending'
      data.chunk_count = 0
      data.enabled = true

      // 如果没有指定分块参数，使用知识库的默认参数
      if (!data.chunk_size) {
        data.chunk_size = ragBase.chunk_size || 1000
      }
      if (!data.chunk_overlap) {
        data.chunk_overlap = ragBase.chunk_overlap || 200
      }
      if (!data.chunk_method) {
        data.chunk_method = ragBase.chunk_method || 'sliding_window'
      }
      if (!data.embedding_model) {
        data.embedding_model = ragBase.embedding_model
      }
      if (!data.embedding_dimension) {
        data.embedding_dimension = ragBase.embedding_dimension || 1024
      }
      if (!data.collection_name) {
        data.collection_name = ragBase.vector_collection
      }

      // 创建文档记录
      const document = await ctx.model.RagDocument.create(data)

      // 更新知识库文档计数
      await ragBase.increment('document_count')

      return { success: true, data: document }
    } catch (error) {
      ctx.logger.error('创建文档失败:', error)
      return { success: false, error: error.message || '创建文档失败' }
    }
  }

  /**
   * 获取文档列表
   * @param {number} ragBaseId 知识库ID
   * @param {Object} query 查询条件
   * @param {number} page 页码
   * @param {number} pageSize 每页数量
   * @returns {Promise<Object>} 文档列表
   */
  async list(ragBaseId, query = {}, page = 1, pageSize = 20) {
    const { ctx } = this
    try {
      // 构建查询条件
      const where = { rag_base_id: ragBaseId }

      // 添加其他查询条件
      if (query.status) where.status = query.status
      if (query.enabled !== undefined) where.enabled = query.enabled
      if (query.file_type) where.file_type = query.file_type

      // 分页查询
      const result = await ctx.model.RagDocument.findAndCountAll({
        where,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        order: [['updated_at', 'DESC']],
      })

      return {
        success: true,
        data: result.rows,
        total: result.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      }
    } catch (error) {
      ctx.logger.error('获取文档列表失败:', error)
      return { success: false, error: error.message || '获取文档列表失败' }
    }
  }

  /**
   * 获取文档详情
   * @param {number} id 文档ID
   * @returns {Promise<Object>} 文档详情
   */
  async get(id) {
    const { ctx } = this
    try {
      const document = await ctx.model.RagDocument.findByPk(id)

      if (!document) {
        return { success: false, error: '文档不存在' }
      }

      return { success: true, data: document }
    } catch (error) {
      ctx.logger.error('获取文档详情失败:', error)
      return { success: false, error: error.message || '获取文档详情失败' }
    }
  }

  /**
   * 更新文档
   * @param {number} id 文档ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async update(id, data) {
    const { ctx } = this
    try {
      const document = await ctx.model.RagDocument.findByPk(id)

      if (!document) {
        return { success: false, error: '文档不存在' }
      }

      // 不允许修改的字段
      delete data.rag_base_id
      delete data.file_path
      delete data.file_size
      delete data.file_type
      delete data.mime_type
      delete data.chunk_count

      // 更新文档
      await document.update(data)

      return { success: true, data: document }
    } catch (error) {
      ctx.logger.error('更新文档失败:', error)
      return { success: false, error: error.message || '更新文档失败' }
    }
  }

  /**
   * 删除文档
   * @param {number} id 文档ID
   * @returns {Promise<Object>} 删除结果
   */
  async delete(id) {
    const { ctx } = this
    try {
      const document = await ctx.model.RagDocument.findByPk(id)

      if (!document) {
        return { success: false, error: '文档不存在' }
      }

      // 获取知识库信息
      const ragBase = await ctx.model.RagBase.findByPk(document.rag_base_id)

      // 删除文档
      await document.destroy()

      // 更新知识库文档计数
      if (ragBase) {
        await ragBase.decrement('document_count')
      }

      // 删除相关的文本块
      await ctx.model.RagChunk.destroy({
        where: { document_id: id },
      })

      // 删除向量存储中的数据
      try {
        const lancedbService = ctx.service.rag.manager.lancedb
        const collection = document.collection_name || ragBase.vector_collection
        await lancedbService.deleteDocument(collection, id.toString())
      } catch (e) {
        ctx.logger.error('删除向量数据失败:', e)
        // 不影响主流程，继续执行
      }

      return { success: true, message: '文档删除成功' }
    } catch (error) {
      ctx.logger.error('删除文档失败:', error)
      return { success: false, error: error.message || '删除文档失败' }
    }
  }

  /**
   * 处理文档
   * @param {number} id 文档ID
   * @returns {Promise<Object>} 处理结果
   */
  async process(id) {
    const { ctx } = this
    try {
      const document = await ctx.model.RagDocument.findByPk(id)

      if (!document) {
        return { success: false, error: '文档不存在' }
      }

      // 更新状态为处理中
      await document.update({ status: 'indexing' })

      // 获取知识库信息
      const ragBase = await ctx.model.RagBase.findByPk(document.rag_base_id)
      if (!ragBase) {
        await document.update({
          status: 'failed',
          error_message: '知识库不存在',
        })
        return { success: false, error: '知识库不存在' }
      }

      // 处理文档
      const startTime = Date.now()

      try {
        // 调用RAG服务处理文档
        const result = await ctx.service.rag.processDocument(document, {
          chunkSize: document.chunk_size,
          chunkOverlap: document.chunk_overlap,
          chunkMethod: document.chunk_method,
          model: document.embedding_model,
          dimensions: ragBase.embedding_dimension,
          collection: document.collection_name || ragBase.vector_collection,
          baseURL: ragBase.base_url,
          apiKey: ragBase.api_key,
        })

        if (!result.success) {
          throw new Error(result.error || '处理失败')
        }

        // 更新文档状态
        const processingTime = (Date.now() - startTime) / 1000
        await document.update({
          status: 'ready',
          chunk_count: result.chunks,
          processing_time: processingTime,
          error_message: null,
        })

        return {
          success: true,
          data: {
            id: document.id,
            status: 'ready',
            chunks: result.chunks,
            processingTime,
          },
        }
      } catch (error) {
        // 处理失败，更新状态
        await document.update({
          status: 'failed',
          error_message: error.message || '处理失败',
        })

        throw error
      }
    } catch (error) {
      ctx.logger.error('处理文档失败:', error)
      return { success: false, error: error.message || '处理文档失败' }
    }
  }

  /**
   * 上传并处理文档
   * @param {Object} file 文件对象
   * @param {number} ragBaseId 知识库ID
   * @param {Object} options 选项
   * @returns {Promise<Object>} 处理结果
   */
  async upload(file, ragBaseId, options = {}) {
    const { ctx } = this
    try {
      // 创建文档记录
      const documentData = {
        ...options,
        rag_base_id: ragBaseId,
        title: options.title || file.filename,
        description: options.description || '',
        file_path: file.filepath,
        file_size: file.size || 0,
        file_type: path.extname(file.filename).substring(1),
        mime_type: file.mimeType,
        source: options.source || 'upload',
      }

      const createResult = await this.create(documentData, ragBaseId)
      if (!createResult.success) {
        return createResult
      }

      const document = createResult.data

      // 如果设置了自动处理，则立即处理文档
      if (options.autoProcess !== false) {
        // 异步处理文档，不等待完成
        this.process(document.id).catch(error => {
          ctx.logger.error('自动处理文档失败:', error)
        })
      }

      return { success: true, data: document }
    } catch (error) {
      ctx.logger.error('上传文档失败:', error)
      return { success: false, error: error.message || '上传文档失败' }
    }
  }

  /**
   * 获取文档分段列表
   * @param {number} id 文档ID
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分段列表
   */
  async getChunks(id, options = {}) {
    const { ctx } = this
    try {
      const document = await ctx.model.RagDocument.findByPk(id)

      if (!document) {
        return { success: false, error: '文档不存在' }
      }

      // 获取知识库信息
      const ragBase = await ctx.model.RagBase.findByPk(document.rag_base_id)
      if (!ragBase) {
        return { success: false, error: '知识库不存在' }
      }

      // 如果文档状态不是ready，则从数据库获取分段
      if (document.status !== 'ready') {
        // 从数据库获取分段
        const chunkService = ctx.service.ragCrud.ragChunk
        const result = await chunkService.list(id, options.page, options.pageSize)
        return result
      }

      // 从LanceDB获取分段
      try {
        const lancedbService = ctx.service.rag.manager.lancedb
        const collection = document.collection_name || ragBase.vector_collection
        
        // 构建过滤条件，只获取当前文档的分段
        const filter = `document_id = '${id}'`
        
        // 执行查询
        await lancedbService.ensureInitialized()
        const result = await lancedbService.getAllRecords(
          collection,
          {
            limit: options.limit || 1000,
            outputFields: ['id', 'document_id', 'text', 'metadata'],
            filter,
          }
        )

        if (!result.success) {
          throw new Error(result.error || '获取分段失败')
        }

        // 处理结果
        const chunks = result.matches.map((match, index) => {
          // 解析元数据
          let metadata = match.metadata
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata)
            } catch (e) {
              // 解析失败，保持原样
            }
          }

          return {
            id: match.id,
            document_id: match.document_id,
            content: match.text,
            chunk_index: index,
            metadata
          }
        })

        return {
          success: true,
          data: chunks,
          total: chunks.length,
          page: 1,
          pageSize: chunks.length
        }
      } catch (error) {
        ctx.logger.error('从LanceDB获取分段失败:', error)
        
        // 如果从LanceDB获取失败，尝试从数据库获取
        const chunkService = ctx.service.ragCrud.ragChunk
        return await chunkService.list(id, options.page, options.pageSize)
      }
    } catch (error) {
      ctx.logger.error('获取文档分段列表失败:', error)
      return { success: false, error: error.message || '获取文档分段列表失败' }
    }
  }
}

module.exports = RagDocumentService
