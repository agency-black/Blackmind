import { Embeddings } from '@langchain/core/embeddings'

export interface SiliconFlowEmbeddingsParams {
  apiKey?: string
  model?: string
  baseURL?: string
  maxRetries?: number
  timeout?: number
}

export class SiliconFlowEmbeddings extends Embeddings {
  private apiKey: string
  private model: string
  private baseURL: string
  private maxRetries: number
  private timeout: number

  constructor(params: SiliconFlowEmbeddingsParams = {}) {
    super(params)

    this.apiKey = params.apiKey ?? process.env.SILICON_FLOW_API_KEY ?? ''
    this.model = params.model ?? 'BAAI/bge-m3'
    this.baseURL = params.baseURL ?? 'https://api.siliconflow.cn/v1'
    this.maxRetries = params.maxRetries ?? 3
    this.timeout = params.timeout ?? 10000

    if (!this.apiKey) {
      throw new Error('SiliconFlow API key is required')
    }
  }

  /**
   * 调用SiliconFlow API获取embeddings
   */
  private async callSiliconFlowAPI(
    input: string | string[],
  ): Promise<number[][]> {
    const url = `${this.baseURL}/embeddings`

    const requestBody = {
      model: this.model,
      input: input,
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `SiliconFlow API error: ${response.status} ${response.statusText} - ${errorText}`,
          )
        }

        const data = await response.json()

        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid response format from SiliconFlow API')
        }

        // 提取embedding向量
        return data.data.map((item: any) => {
          if (!item.embedding || !Array.isArray(item.embedding)) {
            throw new Error('Invalid embedding format in response')
          }
          return item.embedding
        })
      } catch (error) {
        lastError = error as Error

        if (attempt === this.maxRetries - 1) {
          break
        }

        // 指数退避重试
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error(
      `Failed to get embeddings after ${this.maxRetries} attempts: ${lastError?.message}`,
    )
  }

  /**
   * 为单个查询文本生成embedding
   */
  async embedQuery(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Input text cannot be empty')
    }

    const embeddings = await this.callSiliconFlowAPI(text)
    return embeddings[0]
  }

  /**
   * 为多个文档生成embeddings
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    if (!documents || documents.length === 0) {
      throw new Error('Documents array cannot be empty')
    }

    // 过滤空文档
    const validDocuments = documents.filter(doc => doc && doc.trim().length > 0)

    if (validDocuments.length === 0) {
      throw new Error('No valid documents found')
    }

    // SiliconFlow API支持批量处理，但需要注意token限制
    // 对于大量文档，可能需要分批处理
    const batchSize = 100 // 根据API限制调整
    const results: number[][] = []

    for (let i = 0; i < validDocuments.length; i += batchSize) {
      const batch = validDocuments.slice(i, i + batchSize)
      const batchEmbeddings = await this.callSiliconFlowAPI(batch)
      results.push(...batchEmbeddings)
    }

    return results
  }
}
