const OpenAI = require('openai')
const BaseLLMService = require('./base')
const https = require('https')

class GeminiService extends BaseLLMService {
  constructor(ctx) {
    super(ctx)
    this.provider = 'gemini'
  }

  async createClient(config) {
    if (!config || !config.baseUrl || !config.apiKey) {
      throw new Error(this.ctx.__('chat.key_empty'))
    }
    if(config.baseUrl.endsWith('/')) {
      config.baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1)
    }
    if(config.baseUrl === 'https://generativelanguage.googleapis.com') {
      config.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/'
    }
    if(config.baseUrl == 'https://generativelanguage.googleapis.com/v1beta') {
      config.baseUrl += '/openai/'
    }
    return new OpenAI({
      // apiKey: this.decrypt(config.apiKey),
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      httpAgent: https.globalAgent,
      httpsAgent: https.globalAgent,
    })
  }

  async testConnection(config, model) {
    try {
      const client = await this.createClient(config)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      const response = await client.chat.completions.create({
        model: model_id,
        messages: [{ role: 'user', content: 'test' }],
        // max_tokens: 1,
      })
      if(!response.choices || response.choices.length == 0) {
        if(response.error) {
          if(response.error.metadata && response.error.metadata.raw) {
            try {
              const json = JSON.parse(response.error.metadata.raw)
              throw new Error(json.error)
            } catch (error) {
              
            }
            throw new Error(response.error.metadata.raw)
          }
          throw new Error(response.error)
        }
      }
      return response.choices.length > 0
    } catch (error) {
      if (error.status == 401) {
        throw new Error(this.ctx.__('connection.auth_failed') + `(${error.status})`)
      } else {
        throw new Error(this.ctx.__('connection.test_failed') + error.message)
      }
    }
  }

  async listModels() {
    // 使用基类的 listModels 方法
    return super.listModels()
  }

  async chat(model, messages, config, sessionSettings, tools, docs) {
    const { ctx } = this
    try {
      const configSaved = await this.getConfig(model.provider_id)
      console.log(configSaved)
      const client = await this.createClient(configSaved)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      /**
       * 合并相同角色的消息
       * */
      const mergedMessages = []
      if (messages && messages.length > 0) {
        let currentMessage = { ...messages[0] }
        
        if(messages.length > 0 && typeof messages[0].reasoning_content != 'undefined') {
          delete messages[0].reasoning_content
        }
        
        for (let i = 1; i < messages.length; i++) {

          /**
           * For Error: 
           * 400 The reasoning_content is an intermediate result for display purposes only and will not be included in the context for inference. Please remove the reasoning_content from your message to reduce network traffic.
           */
          if(typeof messages[i].reasoning_content != 'undefined') {
            delete messages[i].reasoning_content
          }
          /**
           * 
          * deepseek 不支持连续相同角色的消息
          * For Error: 400 deepseek-reasoner does not support successive user or assistant messages (messages[1] and messages[2] in your input). You should interleave the user/assistant messages in the message sequence.
           */
          if (messages[i].role === currentMessage.role) {
            // 如果角色相同，合并内容
            currentMessage.content += '\n' + messages[i].content
          } else {
            // 如果角色不同，添加当前消息并开始新消息
            mergedMessages.push(currentMessage)
            currentMessage = { ...messages[i] }
          }
        }
        // 添加最后一条消息
        mergedMessages.push(currentMessage)
      }

      const systemPrompts = this.ctx.service.prompt.buildSystemPrompt(
        sessionSettings.systemPrompt,
        docs,
        tools,
        // customPrompts
      );

      const messagesWithSystemPrompt = [
        { role:'system', content: systemPrompts },
        ...mergedMessages,
      ]

      console.log(sessionSettings)

      const params = {
        model: model_id,
        messages: messagesWithSystemPrompt,
        stream: true,
      }
      console.log(params)
      if (tools && tools.length > 0) {
        params.tools =
          this.ctx.service.tools.convertMcpToolsToOpenaiTools(tools)
      }
      const response = await client.chat.completions.create(params)
      // return response.choices[0].message.content
      return response
    } catch (error) {
      throw new Error(`${error.message}`)
    }
  }

  async chatNoStream(messages, model, provider_id) {
    const { ctx } = this
    try {
      const configSaved = await this.getConfig(model.provider_id)
      const client = await this.createClient(configSaved)
      const model_id = model.id.includes(':')
        ? model.id.split(model.provider_id + ':').pop()
        : model.id
      const response = await client.chat.completions.create({
        model: model_id,
        messages,
        stream: false,
        // max_tokens: 2048,
        // temperature: 0.7,
      })
      return response
    } catch (error) {
      ctx.logger.error(error)
      throw new Error(error.message)
    }
  }
}

module.exports = GeminiService
