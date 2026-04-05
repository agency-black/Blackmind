import { OllamaEmbeddings } from '@langchain/ollama'

const embeddings = new OllamaEmbeddings({
  baseUrl: process.env.OLLAMA_BASE_URL,
  model: 'mistral',
})
