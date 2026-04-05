import 'cheerio'
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'
import { Document } from '@langchain/core/documents'

export const webloader = async (url: string, pTagSelector: string = 'p') => {
  const cheerioLoader = new CheerioWebBaseLoader(url, {
    // selector: pTagSelector,
  })
  const docs = await cheerioLoader.load()
  return docs
}
