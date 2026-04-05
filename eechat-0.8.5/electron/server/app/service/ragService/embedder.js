const { Service } = require('egg')
const http = require('http')
const https = require('https')

class EmbedderService extends Service {

  /**
   * 创建批次
   */
  createBatches(array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 嵌入一批文本
   * @param {Array<string>} texts 文本数组
   * @param {string} model 模型名称
   * @returns {Promise<Array<Array<number>>>} 嵌入向量数组
   */
  async embedBatch(texts, options) {
    const embeddings = []
    
    // 为每个文本生成嵌入向量
    const {model, dimensions, baseURL, apiKey} = options
    for (const text of texts) {
      try {
        // const embedding = await this.callOllamaEmbedding(text, model)
        const embedding = await this.callOpenAIEmbedding(text, model, dimensions, baseURL, apiKey)
        embeddings.push(embedding)
      } catch (error) {
        this.ctx.logger.error(`获取文本嵌入向量失败: ${text.substring(0, 50)}...`, error)
        throw error
      }
    }
    
    return embeddings
  }
  
  /**
   * 调用Ollama API获取嵌入向量
   * @param {string} text 文本
   * @param {string} model 模型名称
   * @returns {Promise<Array<number>>} 嵌入向量
   */
  async callOllamaEmbedding(text, model) {
    return new Promise((resolve, reject) => {
      // 准备请求数据
      const data = JSON.stringify({
        model: model,
        prompt: text
      })
      
      // 请求选项
      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/embeddings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }
      
      // 发送请求
      const req = http.request(options, (res) => {
        let responseData = ''
        
        // 接收数据
        res.on('data', (chunk) => {
          responseData += chunk
        })
        
        // 请求完成
        res.on('end', () => {
          try {
            // 解析响应
            const response = JSON.parse(responseData)
            
            if (response.embedding) {
              this.ctx.logger.debug('获取嵌入向量成功:', text)
              resolve(response.embedding)
            } else {
              this.ctx.logger.error('Ollama API返回无效响应:', response)
              reject(new Error('无效的嵌入向量响应'))
            }
          } catch (error) {
            this.ctx.logger.error('解析Ollama API响应失败:', error)
            reject(error)
          }
        })
      })
      
      // 错误处理
      req.on('error', (error) => {
        this.ctx.logger.error('调用Ollama API失败:', error)
        reject(error)
      })
      
      // 发送数据
      req.write(data)
      req.end()
    })
  }


  /**
   * 调用OpenAI API获取嵌入向量
   * @param {Array<string>} texts 文本数组
   * @param {string} model 模型名称
   * @param {string} baseURL API基础URL
   * @param {string} apiKey API密钥
   * @returns {Promise<Array<Array<number>>>} 嵌入向量数组
   */
  async callOpenAIEmbedding(texts, model, dimensions, baseURL, apiKey) {
    return new Promise((resolve, reject) => {
      // 准备请求数据
      const data = JSON.stringify({
        model: model,
        input: texts,
        dimensions,
      });
      
      // 解析URL
      const url = new URL(`${baseURL}/embeddings`);
      
      // 请求选项
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data)
        }
      };
      
      // 选择http或https模块
      const requestModule = url.protocol === 'https:' ? https : http;
      
      // 发送请求
      const req = requestModule.request(options, (res) => {
        let responseData = '';
        
        // 接收数据
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        // 请求完成
        res.on('end', () => {
          try {
            // 解析响应
            const response = JSON.parse(responseData);
            
            if (res.statusCode !== 200) {
              this.ctx.logger.error('OpenAI API 返回错误:', response);
              reject(new Error(`OpenAI API 错误: ${response.error.message || '未知错误'}`));
              return;
            }
            
            if (response.data && Array.isArray(response.data)) {
              // 提取嵌入向量
              const embeddings = response.data.map(item => item.embedding);
              this.ctx.logger.info(`成功获取 ${embeddings.length} 个嵌入向量`);
              resolve(embeddings[0]);
            } else {
              this.ctx.logger.error('OpenAI API 返回无效响应:', response);
              reject(new Error('无效的嵌入向量响应'));
            }
          } catch (error) {
            this.ctx.logger.error('解析 OpenAI API 响应失败:', error);
            reject(error);
          }
        });
      });
      
      // 错误处理
      req.on('error', (error) => {
        this.ctx.logger.error('调用 OpenAI API 失败:', error);
        reject(error);
      });
      
      // 发送数据
      req.write(data);
      req.end();
    });
  }

}

module.exports = EmbedderService
