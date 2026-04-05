import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Document } from '@langchain/core/documents'

/**
 *
 * @param docs Document
 * @param options
 * @returns
 */
export const splitter = async (
  docs: Document[],
  options = {
    chunkSize: 1000,
    chunkOverlap: 200,
  },
) => {
  const splitter = new RecursiveCharacterTextSplitter(options)
  const allSplits = await splitter.splitDocuments(docs)
  return allSplits
}
