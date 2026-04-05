import { defineStore } from 'pinia'
import { documentApi } from '@/api/request'
import type { Document, DocumentState } from '@/types/rag'

export const useDocumentStore = defineStore('document', {
  state: (): DocumentState => ({
    documents: [],
    currentDocument: null,
    loading: false,
    uploading: false,
    processing: false,
    error: null,
    totalCount: 0,
    page: 1,
    pageSize: 20,
  }),

  getters: {
    // 获取文档总页数
    totalPages: state => Math.ceil(state.totalCount / state.pageSize),

    // 按状态过滤文档
    documentsByStatus: state => (status: string) => {
      return state.documents.filter(doc => doc.status === status)
    },

    // 获取启用的文档
    enabledDocuments: state => {
      return state.documents.filter(doc => doc.enabled)
    },
  },

  actions: {
    // 获取文档列表
    async fetchDocuments(baseId: number | string, params = {}) {
      if (this.loading) return

      try {
        this.loading = true
        this.error = null

        const { page = 1, pageSize = 20, ...otherParams } = params as any
        this.page = page
        this.pageSize = pageSize

        const response = await documentApi.listDocuments(baseId, {
          page,
          pageSize,
          ...otherParams,
        })

        this.documents = response.list || []
        this.totalCount = response.total || 0

        return this.documents
      } catch (error) {
        console.error('获取文档列表失败:', error)
        this.error = error instanceof Error ? error.message : '获取文档列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取文档详情
    async fetchDocument(id: number | string) {
      if (this.loading) return

      try {
        this.loading = true
        this.error = null

        const response = await documentApi.getDocument(id)
        this.currentDocument = response.data

        return this.currentDocument
      } catch (error) {
        console.error('获取文档详情失败:', error)
        this.error = error instanceof Error ? error.message : '获取文档详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建文档
    async createDocument(baseId: number | string, data: Partial<Document>) {
      try {
        this.loading = true
        this.error = null

        const response = await documentApi.createDocument(baseId, data)

        // 添加到文档列表
        this.documents.unshift(response.data)
        this.totalCount++

        return response.data
      } catch (error) {
        console.error('创建文档失败:', error)
        this.error = error instanceof Error ? error.message : '创建文档失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新文档
    async updateDocument(id: number | string, data: Partial<Document>) {
      try {
        this.loading = true
        this.error = null

        const response = await documentApi.updateDocument(id, data)

        // 更新列表中的文档
        const index = this.documents.findIndex(doc => doc.id === id)
        if (index !== -1) {
          this.documents[index] = { ...this.documents[index], ...response.data }
        }

        // 如果是当前文档，也更新当前文档
        if (this.currentDocument && this.currentDocument.id === id) {
          this.currentDocument = { ...this.currentDocument, ...response.data }
        }

        return response.data
      } catch (error) {
        console.error('更新文档失败:', error)
        this.error = error instanceof Error ? error.message : '更新文档失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除文档
    async deleteDocument(id: number | string) {
      try {
        this.loading = true
        this.error = null

        await documentApi.deleteDocument(id)

        // 从列表中移除文档
        this.documents = this.documents.filter(doc => doc.id !== id)
        this.totalCount--

        // 如果是当前文档，清空当前文档
        if (this.currentDocument && this.currentDocument.id === id) {
          this.currentDocument = null
        }

        return true
      } catch (error) {
        console.error('删除文档失败:', error)
        this.error = error instanceof Error ? error.message : '删除文档失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 处理文档（索引）
    async processDocument(id: number | string) {
      try {
        this.processing = true
        this.error = null

        const response = await documentApi.processDocument(id)

        // 更新文档状态
        const index = this.documents.findIndex(doc => doc.id === id)
        if (index !== -1) {
          this.documents[index].status = 'indexing'
        }

        // 如果是当前文档，也更新当前文档状态
        if (this.currentDocument && this.currentDocument.id === id) {
          this.currentDocument.status = 'indexing'
        }

        return response
      } catch (error) {
        console.error('处理文档失败:', error)
        this.error = error instanceof Error ? error.message : '处理文档失败'
        throw error
      } finally {
        this.processing = false
      }
    },

    // 上传文档
    async uploadDocuments(
      baseId: number | string,
      formData: FormData,
      onProgress?: (progress: number) => void,
    ) {
      try {
        this.uploading = true
        this.error = null

        const response = await documentApi.uploadDocument(
          baseId,
          formData,
          onProgress,
        )

        // 上传成功后刷新文档列表
        await this.fetchDocuments(baseId)

        return response
      } catch (error) {
        console.error('上传文档失败:', error)
        this.error = error instanceof Error ? error.message : '上传文档失败'
        throw error
      } finally {
        this.uploading = false
      }
    },

    // 切换文档启用状态
    async toggleDocumentEnabled(id: number | string, enabled: boolean) {
      return this.updateDocument(id, { enabled })
    },

    // 获取文档分段
    async getDocumentChunks(id: number | string, params = {}) {
      try {
        this.loading = true
        this.error = null
        const response = await documentApi.getDocumentChunks(id, params)
        return response
      } catch (error) {
        console.error('获取文档分段失败:', error)
        this.error =
          error instanceof Error? error.message : '获取文档分段失败'
        throw error
      }
    },

    // 重置状态
    resetState() {
      this.documents = []
      this.currentDocument = null
      this.loading = false
      this.uploading = false
      this.processing = false
      this.error = null
      this.totalCount = 0
      this.page = 1
      this.pageSize = 20
    },
  },
})
