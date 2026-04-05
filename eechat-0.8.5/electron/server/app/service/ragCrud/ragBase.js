const { Service } = require('egg')
const { nanoid } = require('nanoid')

class RagBaseService extends Service {
  /**
   * 创建知识库
   * @param {Object} data 知识库数据
   * @param {string} uid 用户ID
   * @returns {Promise<Object>} 创建结果
   */
  async create(data, uid) {
    const { ctx } = this
    try {
      // 确保必填字段
      if (!data.title) {
        data.title = '新知识库'
      }

      // 设置用户ID
      if (!uid) {
        uid = 'default_user'
      }
      data.uid = uid

      // 生成 vector_collection 名称（如果没有提供）
      if (!data.vector_collection) {
        data.vector_collection = `rag_${nanoid(10)}`
      }

      // 创建知识库记录
      const ragBase = await ctx.model.RagBase.create(data)

      // 同步创建 LanceDB 表
      try {
        const lancedbService = ctx.service.rag.manager.lancedb
        const config = await ctx.service.rag.getConfig()

        // 确保 LanceDB 已初始化
        await lancedbService.ensureInitialized(config)

        // 获取嵌入维度
        const dimension = data.embedding_dimension || config.embedding.dimension

        // 创建表
        await lancedbService.createTable(data.vector_collection, dimension)

        ctx.logger.info('知识库向量表创建成功:', {
          collection: data.vector_collection,
          dimension,
        })
      } catch (e) {
        ctx.logger.error('创建向量表失败:', e)
        // 不影响主流程，继续执行
      }

      return { success: true, data: ragBase }
    } catch (error) {
      ctx.logger.error('创建知识库失败:', error)
      return { success: false, error: error.message || '创建知识库失败' }
    }
  }

  /**
   * 获取知识库列表
   * @param {string} uid 用户ID
   * @param {boolean} is_default 是否默认知识库
   * @param {number} page 页码
   * @param {number} pageSize 每页数量
   * @returns {Promise<Object>} 知识库列表
   */
  async list(uid, is_default, page = 1, pageSize = 20) {
    const { ctx } = this
    try {
      // 构建查询条件
      const where = {}
      if (uid) where.uid = uid
      if (is_default !== undefined) where.is_default = is_default
      
      // 分页查询
      const result = await ctx.model.RagBase.findAndCountAll({
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
      ctx.logger.error('获取知识库列表失败:', error)
      return { success: false, error: error.message || '获取知识库列表失败' }
    }
  }

  /**
   * 获取知识库详情
   * @param {number} id 知识库ID
   * @returns {Promise<Object>} 知识库详情
   */
  async get(id) {
    const { ctx } = this
    try {
      const ragBase = await ctx.model.RagBase.findByPk(id)
      
      if (!ragBase) {
        return { success: false, error: '知识库不存在' }
      }
      
      return { success: true, data: ragBase }
    } catch (error) {
      ctx.logger.error('获取知识库详情失败:', error)
      return { success: false, error: error.message || '获取知识库详情失败' }
    }
  }

  /**
   * 更新知识库
   * @param {number} id 知识库ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async update(id, data) {
    const { ctx } = this
    try {
      const ragBase = await ctx.model.RagBase.findByPk(id)

      if (!ragBase) {
        return { success: false, error: '知识库不存在' }
      }

      // 不允许修改的字段
      delete data.uid
      delete data.vector_collection

      // 更新知识库
      await ragBase.update(data)

      // 如果更新了嵌入维度，需要检查 LanceDB 表
      if (
        data.embedding_dimension &&
        data.embedding_dimension !== ragBase.embedding_dimension
      ) {
        try {
          const lancedbService = ctx.service.rag.manager.lancedb
          const config = await ctx.service.rag.getConfig()

          // 确保 LanceDB 已初始化
          await lancedbService.ensureInitialized(config)

          // 检查表是否存在
          const hasTable = await lancedbService.hasTable(
            ragBase.vector_collection,
          )

          if (hasTable) {
            // 如果表已存在且维度变更，需要删除旧表并创建新表
            await lancedbService.dropTable(ragBase.vector_collection)
            await lancedbService.createTable(
              ragBase.vector_collection,
              data.embedding_dimension,
            )

            ctx.logger.info('知识库向量表重建成功:', {
              collection: ragBase.vector_collection,
              dimension: data.embedding_dimension,
            })
          }
        } catch (e) {
          ctx.logger.error('更新向量表失败:', e)
          // 不影响主流程，继续执行
        }
      }

      return { success: true, data: ragBase }
    } catch (error) {
      ctx.logger.error('更新知识库失败:', error)
      return { success: false, error: error.message || '更新知识库失败' }
    }
  }

  /**
   * 删除知识库
   * @param {number} id 知识库ID
   * @returns {Promise<Object>} 删除结果
   */
  async delete(id) {
    const { ctx } = this
    try {
      const ragBase = await ctx.model.RagBase.findByPk(id)
      
      if (!ragBase) {
        return { success: false, error: '知识库不存在' }
      }
      
      // 删除知识库
      await ragBase.destroy()
      
      // 这里可以添加删除相关文档和向量存储的逻辑
      // 如果需要删除 LanceDB 中的表，可以调用 rag 服务
      try {
        const lancedbService = ctx.service.rag.manager.lancedb
        await lancedbService.dropTable(ragBase.vector_collection)
      } catch (e) {
        ctx.logger.error('删除向量表失败:', e)
        // 不影响主流程，继续执行
      }
      
      return { success: true, message: '知识库删除成功' }
    } catch (error) {
      ctx.logger.error('删除知识库失败:', error)
      return { success: false, error: error.message || '删除知识库失败' }
    }
  }

  /**
   * 设置默认知识库
   * @param {number} id 知识库ID
   * @param {string} uid 用户ID
   * @returns {Promise<Object>} 设置结果
   */
  async setDefault(id, uid) {
    const { ctx } = this
    try {
      const ragBase = await ctx.model.RagBase.findByPk(id)
      
      if (!ragBase) {
        return { success: false, error: '知识库不存在' }
      }
      
      // 先将所有知识库设为非默认
      await ctx.model.RagBase.update(
        { is_default: false },
        { where: { uid: uid || ragBase.uid } }
      )
      
      // 将当前知识库设为默认
      await ragBase.update({ is_default: true })
      
      return { success: true, message: '设置默认知识库成功' }
    } catch (error) {
      ctx.logger.error('设置默认知识库失败:', error)
      return { success: false, error: error.message || '设置默认知识库失败' }
    }
  }
}

module.exports = RagBaseService