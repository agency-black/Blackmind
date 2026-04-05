import { defineStore } from 'pinia'
import { ragApi } from '@/api/request'
import { useDocumentStore } from '@/stores/documentStore'
import type { RagResponse, RagState } from '@/types/rag'

export const useRagStore = defineStore('rag', {
  state: (): RagState => ({
    bases: [],
    loading: false,
    loadingBases: false,
    selectedBase: null,
    error: null,
    initialized: false,
    showCreateDialog: false,
    showEditDialog: false,
    processingDocument: false,
    serviceStatus: {
      running: false,
      error: null,
    },
    usingBases: []
  }),

  actions: {
    // 设置使用的知识库
    setUsingBases(usingBase: number[]) {
      this.usingBases = usingBase
    },
    // 获取知识库列表
    async fetchBases(params = {}) {
      if (this.loadingBases) return

      try {
        this.loadingBases = true
        this.error = null
        const response = await ragApi.listBase(params)
        this.bases = response.list || []
        this.initialized = true
        return this.bases
      } catch (error) {
        console.error('获取知识库列表失败:', error)
        this.error =
          error instanceof Error ? error.message : '获取知识库列表失败'
      } finally {
        this.loadingBases = false
      }
    },

    // 获取知识库详情
    async fetchBaseDetail(id: number | string) {
      if (this.loading) return

      try {
        this.loading = true
        this.error = null
        const response = await ragApi.getBase(id)
        return response
      } catch (error) {
        console.error('获取知识库详情失败:', error)
        this.error =
          error instanceof Error ? error.message : '获取知识库详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建知识库
    async createBase(data: Partial<RagResponse>) {
      try {
        this.loading = true
        this.error = null
        const response = await ragApi.createBase(data)
        // 添加到列表
        this.bases.unshift(response)
        // 如果是默认知识库，更新其他知识库的默认状态
        if (response.is_default) {
          this.bases.forEach(base => {
            if (base.id !== response.id) {
              base.is_default = false
            }
          })
        }
        return response
      } catch (error) {
        console.error('创建知识库失败:', error)
        this.error = error instanceof Error ? error.message : '创建知识库失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新知识库
    async updateBase(id: number | string, data: Partial<RagResponse>) {
      try {
        this.loading = true
        this.error = null
        const response = await ragApi.updateBase(id, data)
        // 更新列表中的数据
        const index = this.bases.findIndex(base => base.id === id)
        if (index !== -1) {
          this.bases[index] = { ...this.bases[index], ...response }
        }
        // 如果是默认知识库，更新其他知识库的默认状态
        if (data.is_default) {
          this.bases.forEach(base => {
            if (base.id !== id) {
              base.is_default = false
            }
          })
        }
        return response
      } catch (error) {
        console.error('更新知识库失败:', error)
        this.error = error instanceof Error ? error.message : '更新知识库失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除知识库
    async deleteBase(id: number | string) {
      try {
        this.loading = true
        this.error = null
        const response = await ragApi.deleteBase(id)
        this.bases = this.bases.filter(base => base.id !== id)
        // 如果删除的是当前选中的知识库，清空选中状态
        if (this.selectedBase && this.selectedBase.id === id) {
          this.selectedBase = null
        }
        return true
      } catch (error) {
        console.error('删除知识库失败:', error)
        this.error = error instanceof Error ? error.message : '删除知识库失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 设置默认知识库
    async setDefaultBase(id: number | string) {
      try {
        this.loading = true
        this.error = null
        const response = await ragApi.setDefaultBase(id)
        this.bases.forEach(base => {
          base.is_default = base.id === id
        })
        return true
      } catch (error) {
        console.error('设置默认知识库失败:', error)
        this.error =
          error instanceof Error ? error.message : '设置默认知识库失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 选择知识库
    selectBase(base: RagResponse) {
      this.selectedBase = base
    },

    // 清除选择的知识库
    clearSelectedBase() {
      this.selectedBase = null
    },

    // 打开创建知识库对话框
    openCreateDialog() {
      this.showCreateDialog = true
    },

    // 关闭创建知识库对话框
    closeCreateDialog() {
      this.showCreateDialog = false
    },

    // 打开编辑知识库对话框
    openEditDialog(base: RagResponse) {
      this.selectedBase = base
      this.showEditDialog = true
    },

    // 关闭编辑知识库对话框
    closeEditDialog() {
      this.showEditDialog = false
    },

    // 处理文档
    async processDocument(data: any) {
      try {
        this.processingDocument = true
        this.error = null
        const response = await ragApi.processDocument(data)
        return response
      } catch (error) {
        console.error('处理文档失败:', error)
        this.error = error instanceof Error ? error.message : '处理文档失败'
        throw error
      } finally {
        this.processingDocument = false
      }
    },

    // 查询知识库
    async queryRag(data: any) {
      try {
        this.loading = true
        this.error = null
        const response = await ragApi.query(data)
        return response
      } catch (error) {
        console.error('查询知识库失败:', error)
        this.error = error instanceof Error ? error.message : '查询知识库失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取服务状态
    async getServiceStatus() {
      try {
        const response = await ragApi.getStatus()
        this.serviceStatus = {
          running: response.running || false,
          error: response.error || null,
        }
        return this.serviceStatus
      } catch (error) {
        console.error('获取服务状态失败:', error)
        this.serviceStatus = {
          running: false,
          error: error instanceof Error ? error.message : '获取服务状态失败',
        }
        return this.serviceStatus
      }
    },

    // 重启服务
    async restartService() {
      try {
        this.loading = true
        this.error = null
        const response = await ragApi.restartService()
        await this.getServiceStatus()
        return response
      } catch (error) {
        console.error('重启服务失败:', error)
        this.error = error instanceof Error ? error.message : '重启服务失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    // 重置状态
    reset() {
      this.bases = []
      this.selectedBase = null
      this.error = null
      this.initialized = false
      this.showCreateDialog = false
      this.showEditDialog = false
    },
  },

  getters: {
    // 获取默认知识库
    defaultBase: state => state.bases.find(base => base.is_default),

    // 获取知识库总数
    baseCount: state => state.bases.length,

    // 获取使用的知识库
    getUsingBases: state => state.usingBases,
  },
})