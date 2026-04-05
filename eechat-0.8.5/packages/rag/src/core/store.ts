import { Chroma } from '@langchain/community/vectorstores/chroma'
import { Document } from '@langchain/core/documents'
import { EmbeddingsInterface } from '@langchain/core/embeddings'
import { SiliconFlowEmbeddings } from './embeder/SiliconFlowEmbeddings'

import { OpenAIEmbeddings } from '@langchain/openai'

const embeddings = new SiliconFlowEmbeddings({
  apiKey: process.env.SILICON_FLOW_API_KEY,
  model: 'BAAI/bge-m3',
})

// const embeddings = new OpenAIEmbeddings({
//   verbose: true,
//   model: 'BAAI/bge-m3',
//   apiKey: process.env.SILICON_FLOW_API_KEY,
//   configuration: {
//     baseURL: 'https://api.siliconflow.cn/v1/embeddings',
//     timeout: 10000,
//   },
// })

export const store = (
  // embeddings: EmbeddingsInterface,
  // splits: Document[],
  collectionName: string,
) => {
  const vectorStore = new Chroma(embeddings, {
    collectionName,
  })
  return vectorStore
}

export const addDocuments = async (
  collectionName: string,
  splits: Document[],
) => {
  const res = await store(collectionName).addDocuments(splits)
  return res
}
