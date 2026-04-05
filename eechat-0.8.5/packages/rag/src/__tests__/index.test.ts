import { Document } from '@langchain/core/documents'
import { run } from '../index'
import { webloader } from '../core/loader/web'
import { splitter } from '../core/splitter'
import { store, addDocuments } from '../core/store'

// Mock dependencies
jest.mock('../core/loader/web')
jest.mock('../core/splitter')
jest.mock('../core/store')
jest.mock('../core/llm')

describe('RAG System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // describe('webloader', () => {
  //   it('should load documents from web', async () => {
  //     const mockDocs = [new Document({ pageContent: 'Test content' })]
  //     ;(webloader as jest.Mock).mockResolvedValue(mockDocs)

  //     const result = await webloader('http://test.com')
  //     expect(result).toEqual(mockDocs)
  //     expect(webloader).toHaveBeenCalledWith('http://test.com')
  //   })
  // })

  // describe('splitter', () => {
  //   it('should split documents into chunks', async () => {
  //     const mockDocs = [new Document({ pageContent: 'Test content' })]
  //     const mockChunks = [
  //       new Document({ pageContent: 'Test' }),
  //       new Document({ pageContent: 'content' }),
  //     ]
  //     ;(splitter as jest.Mock).mockResolvedValue(mockChunks)

  //     const result = await splitter(mockDocs)
  //     expect(result).toEqual(mockChunks)
  //     expect(splitter).toHaveBeenCalledWith(mockDocs, {
  //       chunkSize: 1000,
  //       chunkOverlap: 200,
  //     })
  //   })
  // })

  // describe('store', () => {
  //   it('should create vector store and add documents', async () => {
  //     const mockStore = {
  //       addDocuments: jest.fn().mockResolvedValue(true),
  //     }
  //     ;(store as jest.Mock).mockReturnValue(mockStore)

  //     const mockDocs = [new Document({ pageContent: 'Test content' })]
  //     await addDocuments('test-collection', mockDocs)

  //     expect(store).toHaveBeenCalledWith('test-collection')
  //     expect(mockStore.addDocuments).toHaveBeenCalledWith(mockDocs)
  //   })
  // })

  describe('run', () => {
    it('should process question and return answer', async () => {
      const mockDocs = [new Document({ pageContent: 'Test content' })]
      const mockChunks = [new Document({ pageContent: 'Test chunk' })]

      ;(webloader as jest.Mock).mockResolvedValue(mockDocs)
      ;(splitter as jest.Mock).mockResolvedValue(mockChunks)
      ;(store as jest.Mock).mockReturnValue({
        similaritySearch: jest.fn().mockResolvedValue(mockChunks),
      })

      const result = await run()
      expect(result).toBeDefined()
    })
  })
})
