import { ChatOpenAI } from '@langchain/openai'
import { ChatDeepSeek } from '@langchain/deepseek'

export const llmOpenAi = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
})

export const llmDeepSeek = new ChatDeepSeek({
  model: 'deepseek-chat',
  temperature: 0,
  apiKey: process.env.DEEPSEEK_API_KEY,
})
