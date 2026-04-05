const { Service } = require('egg')
const fs = require('fs')
const path = require('path')
const LanceDbService = require('./lancedb')
const ChunkerService = require('./chunker')
const EmbedderService = require('./embedder')
const IndexerService = require('./indexer')
const RerankerService = require('./reranker')
const ExtractorService = require('./extractor')

class ManagerService extends Service {
  constructor(ctx) {
    super(ctx)
    this.lancedb = new LanceDbService(ctx)
    this.extractor = new ExtractorService(ctx)
    this.chunker = new ChunkerService(ctx)
    this.embedder = new EmbedderService(ctx)
    this.indexer = new IndexerService(ctx)
    this.reranker = new RerankerService(ctx)
    this.initialized = false
  }

  /**
   * 确保服务已初始化
   */
  async ensureInitialized() {
    if (!this.initialized) {
      this.ctx.logger.info('RAG服务首次初始化')
      const config = await this.getConfig()

      // 初始化LanceDB服务
      await this.lancedb.ensureInitialized(config)

      this.initialized = true
    }
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
        '../rag.config.default.json',
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
   * 处理文档
   * @param {Object} document 文档对象
   * @param {Object} options 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async processDocumentRag(document, options) {
    await this.ensureInitialized()

    try {
      // 1. 文本提取
      const extractedText = await this.extractor.extractText(document)

      // 2. 文本分块
      const chunkerService = this.chunker
      const textChunks = await chunkerService.chunkText(extractedText, {
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
        method: options.chunkMethod,
      })

      // 3. 向量嵌入
      const embedderService = this.embedder
      const config = await this.ctx.service.rag.getConfig()
      const embeddings = await embedderService.embedBatch(textChunks, {
        texts: textChunks, 
        model: options.model,
        dimensions: options.dimensions, 
        baseURL: options.baseURL || config.embedding.baseURL,
        apiKey: options.apiKey || config.embedding.apiKey,
      })

      // 4. 索引存储
      const indexerService = this.indexer
      const indexResult = await indexerService.indexDocument(
        document,
        textChunks,
        embeddings,
        { collection: options.collection },
      )

      return {
        success: true,
        documentId: document.id,
        chunks: textChunks.length,
        collection: options.collection || 'documents',
      }
    } catch (error) {
      this.ctx.logger.error('文档处理失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 查询处理
   * @param {string} query 查询文本
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async query(query, options = {}) {
    await this.ensureInitialized()
    const extractedText = query

    try {
      // 设置默认查询模式
      const mode = options.mode || 'naive'
      const collection = options.collection || 'documents'

      // 0. 文本分块
      const chunkerService = this.chunker
      const textChunks = await chunkerService.chunkText(extractedText, {
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
        method: options.chunkMethod,
      })

      // 1. 向量嵌入
      const embedderService = this.embedder
      const config = await this.ctx.service.rag.getConfig()
      const embeddings = await embedderService.embedBatch(textChunks, {
        texts: textChunks, 
        model: options.model,
        dimensions: options.dimensions, 
        baseURL: options.baseURL || config.embedding.baseURL,
        apiKey: options.apiKey || config.embedding.apiKey,
      })

      // 2. 向量检索
      const indexerService = this.indexer
      let searchResult = []
      for (const embedding of embeddings) {
        let res = await indexerService.search(embedding, {
          collection,
          topK: options.topK || 10,
          filter: options.filter || '',
        })
        if(res.success) {
          const { matches } = res
          searchResult = searchResult.concat(matches)
        }
      }

      // 去重并根据查询距离值排序
      searchResult = this.deduplicateAndSortResults(searchResult);
      

      // 3. 重新排序（如果启用）
      if (
        options.rerank &&
        searchResult.matches &&
        searchResult.matches.length > 0
      ) {
        const rerankerService = this.reranker
        searchResult.matches = await rerankerService.rerank(
          query,
          searchResult.matches,
          {
            model: options.rerankModel,
            topK: options.topK || 10,
          },
        )
      }

      // 4. 构建上下文
      // const context = this.buildContext(searchResult.matches, options)

      // 5. 生成回答
      // const answer = await this.generateAnswer(query, context, options)

      return {
        query,
        mode,
        // context,
        // answer,
        matches: searchResult,
      }
    } catch (error) {
      this.ctx.logger.error('查询处理失败:', error)
      return { success: false, error: error.message || '未知错误' }
    }
  }

  /**
   * 构建上下文
   * @param {Array<Object>} matches 匹配结果
   * @param {Object} options 选项
   * @returns {string} 构建的上下文
   */
  buildContext(matches, options) {
    // 简单实现，后续优化
    return matches.map(match => match.text).join('\n\n')
  }

  /**
   * 生成回答
   * @param {string} query 查询文本
   * @param {string} context 上下文
   * @param {Object} options 选项
   * @returns {Promise<string>} 生成的回答
   */
  async generateAnswer(query, context, options) {
    // 构建提示
    const prompt = [
      {
        role: 'system',
        content: '你是一个有用的助手，根据提供的上下文回答问题。',
      },
      { role: 'user', content: `上下文信息：\n${context}\n\n问题：${query}` },
    ]

    // 调用 LLM 服务
    try {
      const response = await this.ctx.service.llm.chatNoStream(
        prompt,
        { id: options.llmModel || 'deepseek-r1' },
        options.llmProvider || 'deepseek',
      )
      return response
    } catch (error) {
      this.ctx.logger.error('生成回答失败:', error)
      return '抱歉，我无法基于当前信息回答这个问题。'
    }
  }

  /**
   * 对搜索结果进行去重和排序
   * @param {Array<Object>} results 搜索结果数组
   * @returns {Array<Object>} 去重并排序后的结果
   */
  deduplicateAndSortResults(results) {
    // 使用Map进行去重，以id为键
    const uniqueMap = new Map();
    
    for (const item of results) {
      // 如果Map中不存在该id，或者存在但当前项的_distance更小（且不为null），则更新Map
      if (!uniqueMap.has(item.id) || 
          (item._distance !== null && 
           (uniqueMap.get(item.id)._distance === null || 
            item._distance < uniqueMap.get(item.id)._distance))) {
        uniqueMap.set(item.id, item);
      }
    }
    
    // 将Map转换回数组
    const uniqueResults = Array.from(uniqueMap.values());
    
    // 根据_distance排序，null值排在最后
    uniqueResults.sort((a, b) => {
      // 如果a的_distance为null，排在后面
      if (a._distance === null) return 1;
      // 如果b的_distance为null，排在后面
      if (b._distance === null) return -1;
      // 正常比较_distance值，升序排列（距离越小越相关）
      return a._distance - b._distance;
    });

    uniqueResults.forEach((item, index) => {
      delete item.vector
    })
    
    return uniqueResults;
  }
}

module.exports = ManagerService
