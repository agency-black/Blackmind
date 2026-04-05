<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { 
  FileText, 
  Download, 
  Trash2, 
  MoreHorizontal,
  FileType,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-vue-next'
import { useRagStore } from '@/stores/rag'
import { useDocumentStore } from '@/stores/documentStore'
import FileTypeIcon from '@/components/rag/FileTypeIcon.vue'
import { Badge } from '@/components/ui/badge'
import { DocumentChunks, Document } from '@/types/rag'

const { t } = useI18n()
const { toast } = useToast()
const ragStore = useRagStore()
const documentStore = useDocumentStore()

// 文档数据
const documents = computed(() => documentStore.documents)
const loading = computed(() => documentStore.loading)

// 获取文档列表
const fetchDocuments = async () => {
  if (!ragStore.selectedBase) return
  
  try {
    await documentStore.fetchDocuments(ragStore.selectedBase.id)
  } catch (error) {
    toast({
      title: t('rag.document.fetchFailed'),
      description: error instanceof Error ? error.message : String(error),
      variant: 'destructive'
    })
  }
}

// 监听选中的知识库变化
watch(() => ragStore.selectedBase, (newBase) => {
  if (newBase) {
    fetchDocuments()
  }
}, { immediate: true })

// 下载文档
const downloadDocument = (doc) => {
  toast({
    title: t('rag.document.downloadStarted'),
    description: t('rag.document.downloadStartedDesc', { title: doc.title })
  })
}

// 删除文档
const deleteDocument = async (doc) => {
  try {
    await documentStore.deleteDocument(doc.id)
    toast({
      title: t('rag.document.deleteSuccess'),
      description: t('rag.document.deleteSuccessDesc', { title: doc.title })
    })
  } catch (error) {
    toast({
      title: t('rag.document.deleteFailed'),
      description: error instanceof Error ? error.message : String(error),
      variant: 'destructive'
    })
  }
}

// 切换文档启用状态
const toggleDocumentEnabled = async (doc, enabled) => {
  try {
    await documentStore.toggleDocumentEnabled(doc.id, enabled)
    toast({
      title: enabled ? t('rag.document.enableSuccess') : t('rag.document.disableSuccess'),
      description: t('rag.document.toggleStatusDesc', { title: doc.title, status: enabled ? t('common.enabled') : t('common.disabled') })
    })
  } catch (error) {
    toast({
      title: t('rag.document.updateFailed'),
      description: error instanceof Error ? error.message : String(error),
      variant: 'destructive'
    })
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 移除旧的 getFileIcon 函数
const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
    case 'docx':
    case 'xlsx':
    case 'md':
    case 'txt':
      return FileText
    default:
      return FileType
  }
}

// 获取状态图标 (pending/indexing/ready/failed)
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return CheckCircle
    case 'pending':
      return Clock
    case 'indexing':
      return Loader2
    case 'failed':
      return AlertCircle
    default:
      return Clock
  }
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready':
      return 'text-green-500'
    case 'pending':
      return 'text-yellow-500'
    case 'indexing':
      return 'text-blue-500'
    case 'failed':
      return 'text-red-500'
    default:
      return 'text-gray-400'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'ready':
      return t('rag.document.statusReady')
    case 'pending':
      return t('rag.document.statusPending')
    case 'indexing':
      return t('rag.document.statusIndexing')
    case 'failed':
      return t('rag.document.statusFailed')
    default:
      return t('rag.document.statusUnknown')
  }
}


const isShowChunkDrawer = ref(false)
const currentDocument = ref<Document>()
const documentChunks = ref<DocumentChunks[]>([])
const chunksLoading = ref(false)

const showChunks = async (doc) => {
  try {
    currentDocument.value = doc
    isShowChunkDrawer.value = true
    chunksLoading.value = true
    
    const result = await documentStore.getDocumentChunks(doc.id)
    if (result && result.list) {
      documentChunks.value = result.list
    } else {
      documentChunks.value = []
      toast({
        title: t('rag.document.chunksEmpty'),
        description: t('rag.document.chunksEmptyDesc'),
        variant: 'default'
      })
    }
  } catch (error) {
    toast({
      title: t('rag.document.fetchChunksFailed'),
      description: error instanceof Error ? error.message : String(error),
      variant: 'destructive'
    })
    documentChunks.value = []
  } finally {
    chunksLoading.value = false
  }
}

// 格式化元数据显示
const formatMetadata = (metadata) => {
  if (!metadata) return ''
  
  // 过滤掉不需要显示的字段
  const filtered = { ...metadata }
  delete filtered.document_id
  
  return Object.entries(filtered)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

// 关闭抽屉
const closeChunkDrawer = () => {
  isShowChunkDrawer.value = false
  setTimeout(() => {
    documentChunks.value = []
    // @ts-ignore
    currentDocument.value = null
  }, 300)
}
</script>

<template>
  <div class="w-full h-full overflow-hidden flex flex-col">
    <ScrollArea class="max-h-[calc(100vh-180px)] relative">
    <table class="max-w-full w-full rounded-md overflow-hidden">
      <thead>
        <tr>
          <th class="w-[300px]">{{ t('rag.document.name') }}</th>
          <th>{{ t('rag.document.dataCount') }}</th>
          <th>{{ t('rag.document.status') }}</th>
          <th>{{ t('rag.document.enabled') }}</th>
          <th>{{ t('rag.document.createdAt') }}</th>
          <th class="text-right p-3">{{ t('rag.document.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in documents" :key="doc.id">
          <td class="">
            <div class="flex flex-col">
              <div class="flex items-center gap-2 cursor-pointer" @click="showChunks(doc)">
                <!-- 替换为新的 FileTypeIcon 组件 -->
                <FileTypeIcon :fileType="doc.file_type" :size="28" />
                <span>{{ doc.title }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1 ml-6">
                {{ doc.description }}
              </div>
            </div>
          </td>
          <td>{{ doc.chunk_count }} 条</td>
          <td>
            <div class="flex items-center gap-2">
              <component :is="getStatusIcon(doc.status)" class="h-4 w-4" :class="getStatusColor(doc.status)" />
              <span>{{ getStatusText(doc.status) }}</span>
            </div>
          </td>
          <td>
            <Switch 
              v-model="doc.enabled" 
              @update:checked="toggleDocumentEnabled(doc, !doc.enabled)"
              :disabled="doc.status === 'indexing'"
            />
          </td>
          <td>{{ formatDate(doc.created_at) }}</td>
          <td class="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" class="h-8 w-8 p-0">
                  <span class="sr-only">{{ t('common.openMenu') }}</span>
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <!-- <DropdownMenuItem @click="downloadDocument(doc)">
                  <Download class="mr-2 h-4 w-4" />
                  <span>{{ t('rag.document.download') }}</span>
                </DropdownMenuItem> -->
                <DropdownMenuItem 
                  @click="deleteDocument(doc)" 
                  class="text-red-600 hover:text-red-500"
                  :disabled="doc.status === 'indexing'"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  <span>{{ t('common.delete') }}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        </tr>
      </tbody>
    </table>
    </ScrollArea>
    
    <!-- 自定义右侧抽屉 -->
    <Teleport to="body">
      <div v-if="isShowChunkDrawer" class="fixed inset-0 bg-black/30 z-50" @click="closeChunkDrawer"></div>
      <div 
        class="fixed top-0 right-0 h-full w-[50%] bg-background shadow-lg z-50 overflow-hidden transition-transform duration-300 ease-in-out border-l"
        :class="isShowChunkDrawer ? 'translate-x-0' : 'translate-x-full'"
      >
        <!-- 抽屉头部 -->
        <div class="p-6 border-b">
          <div class="flex items-center gap-2 font-semibold mt-6">
            <FileTypeIcon v-if="currentDocument" :fileType="currentDocument.file_type" :size="20" />
            {{ currentDocument?.title }} - {{ t('rag.document.chunks') }}
          </div>
          <div class="text-sm text-muted-foreground mt-1">
            {{ t('rag.document.chunksDesc') }}
          </div>
        </div>
        
        <!-- 抽屉内容 -->
        <ScrollArea class="p-6 overflow-y-auto" style="height: calc(100% - 150px);">
          <div v-if="chunksLoading" class="flex justify-center items-center py-8">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
          </div>
          
          <div v-else-if="documentChunks.length === 0" class="text-center py-8 text-muted-foreground">
            {{ t('rag.document.noChunks') }}
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="(chunk, index) in documentChunks" :key="chunk.id" 
                 class="">
              <div class="flex justify-between items-start mb-2">
                <Badge variant="outline" class="mb-2">
                  {{ t('rag.document.chunkIndex') }}: {{ chunk.chunk_index || index }}
                </Badge>
                <Badge variant="secondary" class="text-xs">
                  ID: {{ chunk.id }}
                </Badge>
              </div>
              
              <ScrollArea class="text-sm whitespace-pre-wrap mb-4 overflow-hidden bg-muted p-4 rounded">
                {{ chunk.content }}
              </ScrollArea>
              
              <!-- <details class="text-xs">
                <summary class="cursor-pointer text-muted-foreground hover:text-foreground">
                  {{ t('rag.document.metadata') }}
                </summary>
                <pre class="mt-2 p-2 bg-muted rounded-md overflow-x-auto">{{ JSON.stringify(chunk.metadata, null, 2) }}</pre>
              </details> -->
            </div>
          </div>
        </ScrollArea>
        
        <!-- 抽屉底部 -->
        <div class="p-4 border-t absolute bottom-0 w-full bg-background">
          <Button class="w-full" @click="closeChunkDrawer">{{ t('common.close') }}</Button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
td {
  @apply text-sm p-3 bg-background;
}

th {
  @apply text-left p-3 font-normal text-sm;
}

thead {
  @apply sticky top-0 bg-background z-10 border-b;
}

tbody tr {
  @apply border-b hover:bg-muted/50;
}
</style>