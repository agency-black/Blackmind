const { Service } = require('egg')

class RagChunkService extends Service {
  /**
   * 创建文本块
   * @param {Object} data 文本块数据
   * @returns {Promise<Object>} 创建结果
   */
  async create(data) {
    const { ctx } = this
    try {
      // 确保必填字段
      if (!data.document_id) {
        return { success: false, error: '文档ID不能为空' }
      }
      if (!data.rag_base_id) {
        return { success: false, error: '知识库ID不能为空' }
      }
      if (!data.content) {
        return { success: false, error: '内容不能为空' }
      }
      if (data.chunk_index === undefined) {
        data.chunk_index = 0
      }

      // 创建文本块记录
      const chunk = await ctx.model.RagChunk.create(data)

      return { success: true, data: chunk }
    } catch (error) {
      ctx.logger.error('创建文本块失败:', error)
      return { success: false, error: error.message || '创建文本块失败' }
    }
  }

  /**
   * 批量创建文本块
   * @param {Array<Object>} chunks 文本块数据数组
   * @returns {Promise<Object>} 创建结果
   */
  async bulkCreate(chunks) {
    const { ctx } = this
    try {
      if (!Array.isArray(chunks) || chunks.length === 0) {
        return { success: false, error: '文本块数据不能为空' }
      }

      // 批量创建文本块记录
      const result = await ctx.model.RagChunk.bulkCreate(chunks)

      return { success: true, data: result, count: result.length }
    } catch (error) {
      ctx.logger.error('批量创建文本块失败:', error)
      return { success: false, error: error.message || '批量创建文本块失败' }
    }
  }

  /**
   * 获取文本块列表
   * @param {number} documentId 文档ID
   * @param {number} page 页码
   * @param {number} pageSize 每页数量
   * @returns {Promise<Object>} 文本块列表
   */
  async list(documentId, page = 1, pageSize = 100) {
    const { ctx } = this
    try {
      // 构建查询条件
      const where = { document_id: documentId }

      // 分页查询
      const result = await ctx.model.RagChunk.findAndCountAll({
        where,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        order: [['chunk_index', 'ASC']],
      })

      return {
        success: true,
        data: result.rows,
        total: result.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      }
    } catch (error) {
      ctx.logger.error('获取文本块列表失败:', error)
      return { success: false, error: error.message || '获取文本块列表失败' }
    }
  }

  /**
   * 获取文本块详情
   * @param {number} id 文本块ID
   * @returns {Promise<Object>} 文本块详情
   */
  async get(id) {
    const { ctx } = this
    try {
      const chunk = await ctx.model.RagChunk.findByPk(id)

      if (!chunk) {
        return { success: false, error: '文本块不存在' }
      }

      return { success: true, data: chunk }
    } catch (error) {
      ctx.logger.error('获取文本块详情失败:', error)
      return { success: false, error: error.message || '获取文本块详情失败' }
    }
  }

  /**
   * 更新文本块
   * @param {number} id 文本块ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async update(id, data) {
    const { ctx } = this
    try {
      const chunk = await ctx.model.RagChunk.findByPk(id)

      if (!chunk) {
        return { success: false, error: '文本块不存在' }
      }

      // 不允许修改的字段
      delete data.document_id
      delete data.rag_base_id
      delete data.chunk_index

      // 更新文本块
      await chunk.update(data)

      return { success: true, data: chunk }
    } catch (error) {
      ctx.logger.error('更新文本块失败:', error)
      return { success: false, error: error.message || '更新文本块失败' }
    }
  }

  /**
   * 删除文本块
   * @param {number} id 文本块ID
   * @returns {Promise<Object>} 删除结果
   */
  async delete(id) {
    const { ctx } = this
    try {
      const chunk = await ctx.model.RagChunk.findByPk(id)

      if (!chunk) {
        return { success: false, error: '文本块不存在' }
      }

      // 删除文本块
      await chunk.destroy()

      return { success: true, message: '文本块删除成功' }
    } catch (error) {
      ctx.logger.error('删除文本块失败:', error)
      return { success: false, error: error.message || '删除文本块失败' }
    }
  }

  /**
   * 删除文档的所有文本块
   * @param {number} documentId 文档ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteByDocument(documentId) {
    const { ctx } = this
    try {
      // 删除文档的所有文本块
      const result = await ctx.model.RagChunk.destroy({
        where: { document_id: documentId },
      })

      return { success: true, count: result, message: '文本块删除成功' }
    } catch (error) {
      ctx.logger.error('删除文档文本块失败:', error)
      return { success: false, error: error.message || '删除文档文本块失败' }
    }
  }
}

module.exports = RagChunkService
