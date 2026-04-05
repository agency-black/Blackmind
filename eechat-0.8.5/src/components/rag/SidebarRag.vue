<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { useI18n } from 'vue-i18n'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { Toaster } from '@/components/ui/toast'
import {
  Trash2,
  Plus,
  EllipsisVertical,
  FileText,
  FolderOpen,
  Upload,
  Star,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'
import { h, ref, onMounted, computed } from 'vue'
import { useEnvStore } from "@/stores/env"
import { useRagStore } from "@/stores/rag"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RagForm, RagResponse } from "@/types/rag"

const envStore = useEnvStore()
const ragStore = useRagStore()

// 设置语言
const { t } = useI18n()
const { toast } = useToast()

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

// 知识库文件夹列表
const knowledgeBases = computed(() => ragStore.bases)

const activeFolderId = ref('')

// 切换选中文件夹
const handleFolderChange = folder => {
  activeFolderId.value = folder.id
  ragStore.selectBase(folder)
}

// 删除文件夹相关
const deleteLoading = ref(false)
const folderToDelete = ref(null)

const handleRemoveFolder = item => {
  folderToDelete.value = JSON.parse(JSON.stringify(item))
}

const handleCancelDelete = () => {
  // folderToDelete.value = null
  // deleteLoading.value = false
}

const confirmDeleteFolder = async () => {
  if (!folderToDelete.value) return
  deleteLoading.value = true
  try {
    await ragStore.deleteBase((folderToDelete.value as { id: string }).id)
  } catch (error) {
    console.error('Failed to delete folder:', error)
    toast({
      title: t('rag.sidebar.deleteFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    deleteLoading.value = false
    folderToDelete.value = null
  }
}

// 模型选项
const chunkMethodOptions = [
  { value: 'sliding_window', label: '滑动窗口' },
  // { value: 'recursive', label: '递归分割' },
  // { value: 'sentence', label: '按句子分割' }
]

const embeddingModelOptions = [
  { value: 'text-embedding-v3', label: '阿里云通用文本向量-v3' },
]

const embeddingModelOptionsLocal = [
  { value: 'bge-m3', label: 'bge-m3' }
]

const embeddingDimensionOptions = [
  { value: 1024, label: '1024（默认）' },
  { value: 768, label: '768' },
  { value: 512, label: '512' },
  { value: 256, label: '256' },
  { value: 128, label: '128' },
  { value: 64, label: '64' }
]

const embeddingModelTypeOptions = [
  { value: 'api', label: 'API 模型' },
  { value: 'local', label: '本地模型' }
]

const textUnderstandingModelOptions = [
  { value: 'qwen-max', label: '通义千问-Max' },
]

const imageUnderstandingModelOptions = [
  { value: 'qwen-vl-max', label: '通义千问VL-Max' },
]

const rerankModelOptions = [
  { value: 'gte-rerank', label: '阿里通义gte-rerank' },
]

// 创建新知识库相关
const showCreateDialog = computed(() => ragStore.showCreateDialog)
const newBase = ref<RagForm>({
  title: '',
  description: '',
  chunk_size: 1000,
  chunk_overlap: 10,
  chunk_method: 'sliding_window',
  embedding_model: 'text-embedding-v3',
  embedding_dimension: '1024',
  embedding_model_type: 'api',
  embedding_apikey: '',
  embedding_baseurl: '',
  embedding_model_local: 'bge-m3',
  text_understanding_model: 'qwen-max',
  image_understanding_model: 'qwen-vl-max',
  rerank_enabled: false,
  rerank_model: 'gte-rerank',
  is_default: false,
})

const createLoading = ref(false)

const openCreateDialog = () => {
  // newBase.value = {
  //   title: '',
  //   description: '',
  //   chunk_size: 1000,
  //   chunk_overlap: 200,
  //   chunk_method: 'sliding_window',
  //   embedding_model: 'text-embedding-v3',
  //   embedding_dimension: 1024,
  //   embedding_model_type: 'api',
  //   text_understanding_model: 'gpt-3.5-turbo',
  //   image_understanding_model: 'gpt-4-vision',
  //   rerank_enabled: false,
  //   rerank_model: 'cohere-rerank',
  //   is_default: false,
  // }
  ragStore.openCreateDialog()
}

const closeCreateDialog = () => {
  ragStore.closeCreateDialog()
}

const handleCreateBase = async () => {
  if (!newBase.value.title.trim()) {
    toast({
      title: t('rag.sidebar.titleRequired'),
      variant: 'destructive'
    })
    return
  }

  createLoading.value = true
  try {
    await ragStore.createBase(newBase.value)
    closeCreateDialog()
  } catch (error) {
    toast({
      title: t('rag.sidebar.createFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    createLoading.value = false
  }
}

// 编辑知识库相关
const showEditDialog = computed(() => ragStore.showEditDialog)
const editBase = ref<RagResponse>({
  id: '',
  title: '',
  description: '',
  chunk_size: 1000,
  chunk_overlap: 200,
  chunk_method: 'sliding_window',
  embedding_model: '',
  embedding_dimension: 1024,
  embedding_model_type: 'api',
  text_understanding_model: '',
  image_understanding_model: '',
  rerank_enabled: false,
  rerank_model: '',
  is_default: false
})

const editLoading = ref(false)
const isShowMoreConfig = ref(false)

const openEditDialog = (base) => {
  editBase.value = {
    id: base.id,
    title: base.title,
    description: base.description || '',
    chunk_size: base.chunk_size || 1000,
    chunk_overlap: base.chunk_overlap || 200,
    chunk_method: base.chunk_method || 'sliding_window',
    embedding_model: base.embedding_model || 'text-embedding-v3',
    embedding_dimension: base.embedding_dimension || 1024,
    embedding_model_type: base.embedding_model_type || 'api',
    text_understanding_model: base.text_understanding_model || 'gpt-3.5-turbo',
    image_understanding_model: base.image_understanding_model || 'gpt-4-vision',
    rerank_enabled: base.rerank_enabled || false,
    rerank_model: base.rerank_model || 'cohere-rerank',
    is_default: base.is_default || false
  }
  ragStore.openEditDialog(base)
}

const closeEditDialog = () => {
  ragStore.closeEditDialog()
}

const handleUpdateBase = async () => {
  if (!editBase.value.title.trim()) {
    toast({
      title: t('rag.sidebar.titleRequired'),
      variant: 'destructive'
    })
    return
  }

  editLoading.value = true
  try {
    await ragStore.updateBase(editBase.value.id, {
      title: editBase.value.title,
      description: editBase.value.description,
      chunk_size: editBase.value.chunk_size,
      chunk_overlap: editBase.value.chunk_overlap,
      chunk_method: editBase.value.chunk_method,
      embedding_model: editBase.value.embedding_model,
      embedding_dimension: editBase.value.embedding_dimension,
      embedding_model_type: editBase.value.embedding_model_type,
      text_understanding_model: editBase.value.text_understanding_model,
      image_understanding_model: editBase.value.image_understanding_model,
      rerank_enabled: editBase.value.rerank_enabled,
      rerank_model: editBase.value.rerank_model,
      is_default: editBase.value.is_default,
    })
    closeEditDialog()
  } catch (error) {
    toast({
      title: t('rag.sidebar.updateFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  } finally {
    editLoading.value = false
  }
}

// 设置默认知识库
const setDefaultBase = async (base) => {
  try {
    await ragStore.setDefaultBase(base.id)
  } catch (error) {
    toast({
      title: t('rag.sidebar.setDefaultFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  }
}

onMounted(async () => {
  // 初始化逻辑，从服务器获取知识库列表
  try {
    await ragStore.fetchBases()
    // 如果有默认知识库，选中它
    const defaultBase = ragStore.defaultBase
    if (defaultBase) {
      activeFolderId.value = defaultBase.id as string
      ragStore.selectBase(defaultBase)
    } else if (ragStore.bases.length > 0) {
      // 否则选中第一个知识库
      activeFolderId.value = ragStore.bases[0].id as string
      ragStore.selectBase(ragStore.bases[0])
    }
  } catch (error) {
    console.error('Failed to fetch knowledge bases:', error)
    toast({
      title: t('rag.sidebar.fetchFailed'),
      variant: 'destructive',
      description: (error as Error).message || t('rag.sidebar.unknownError')
    })
  }
})
</script>

<template>
  <Toaster />
  <!-- 添加确认对话框 -->
  <AlertDialog :open="!!folderToDelete" @update:open="handleCancelDelete">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("rag.sidebar.confirmDelete") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("rag.sidebar.confirmDeleteDesc") }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancelDelete">{{
          t("common.cancel")
        }}</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          :disabled="deleteLoading"
          @click="confirmDeleteFolder"
        >
          <Loader2 v-if="deleteLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.delete") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 创建知识库对话框 -->
  <Dialog :open="showCreateDialog" @update:open="closeCreateDialog">
    <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t("rag.sidebar.create") }}</DialogTitle>
        <DialogDescription>
          {{ t("rag.sidebar.createBaseDesc") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="title">{{ t("rag.sidebar.title") }}</Label>
          <Input id="title" v-model="newBase.title" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="description">{{
            t("rag.sidebar.description")
          }}</Label>
          <Textarea id="description" v-model="newBase.description" class="col-span-3" />
        </div>

        <!-- 嵌入模型类型 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="embedding_model_type">{{ t("rag.sidebar.embeddingModelType") }}</Label>
          <div class="col-span-3 w-full">
            <Select v-model="newBase.embedding_model_type" class="col-span-3">
              <SelectTrigger>
                <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingModelType')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in embeddingModelTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <!-- 嵌入模型 API-->
        <div class="grid grid-cols-4 items-center gap-4" v-if="newBase.embedding_model_type == 'api'">
          <Label class="text-right" for="embedding_model">{{ t("rag.sidebar.embeddingModel") }}</Label>
          <div class="col-span-3 w-full">
            <Select v-model="newBase.embedding_model" class="col-span-3">
              <SelectTrigger>
                <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingModel')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in embeddingModelOptions" :key="option.value" :value="option.value">
                  {{ option.label }} ({{ option.value }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 嵌入模型 API key-->
        <!-- <div class="grid grid-cols-4 items-center gap-4" v-if="newBase.embedding_model_type == 'api'">
          <Label class="text-right" for="embedding_model">API Key</Label>
          <div class="col-span-3 w-full">
            <Input id="title" v-model="newBase.embedding_apikey" class="col-span-3" />
          </div>
        </div> -->
        <!-- 嵌入模型 API BaseUrl-->
        <!-- <div class="grid grid-cols-4 items-center gap-4" v-if="newBase.embedding_model_type == 'api'">
          <Label class="text-right" for="embedding_model">API BaseUrl</Label>
          <div class="col-span-3 w-full">
            <Input id="title" v-model="newBase.embedding_baseurl" class="col-span-3" />
          </div>
        </div> -->

        <!-- 嵌入模型本地 -->
        <div class="grid grid-cols-4 items-center gap-4" v-if="newBase.embedding_model_type == 'local'">
          <Label class="text-right" for="embedding_model">{{ t("rag.sidebar.embeddingModel") }}</Label>
          <div class="col-span-3 w-full">
            <Select v-model="newBase.embedding_model_local" class="col-span-3">
              <SelectTrigger>
                <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingModel')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in embeddingModelOptionsLocal" :key="option.value" :value="option.value">
                  {{ option.label }} ({{ option.value }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-zinc-500" for="moreConfig"></Label>
          <div @click="isShowMoreConfig = !isShowMoreConfig" class="flex cursor-pointer text-sm text-zinc-500 items-center space-x-2"> 
            <span>{{ t("rag.sidebar.moreConfig") }}</span> 
            <ChevronDown v-if="!isShowMoreConfig" class="size-4" /> 
            <ChevronUp v-else  class="size-4" /> 
          </div> 
        </div>
        
        <!-- 分块方法 -->
        <div v-if="isShowMoreConfig" class="py-2 grid gap-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="chunk_method">{{ t("rag.sidebar.chunkMethod") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="newBase.chunk_method">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectChunkMethod')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in chunkMethodOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 分块大小 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="chunk_size">{{ t("rag.sidebar.chunkSize") }}</Label>
            <Input id="chunk_size" type="number" v-model="newBase.chunk_size" class="col-span-3" />
          </div>
          
          <!-- 分块重叠 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="chunk_overlap">{{ t("rag.sidebar.chunkOverlap") }}</Label>
            <Input id="chunk_overlap" type="number" v-model="newBase.chunk_overlap" class="col-span-3" />
          </div>
          
          <!-- 嵌入维度 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-embedding_dimension">{{ t("rag.sidebar.embeddingDimension") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="newBase.embedding_dimension">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingDimension')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in embeddingDimensionOptions" :key="option.value" :value="String(option.value)">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 文本理解模型 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="text_understanding_model">{{ t("rag.sidebar.textUnderstandingModel") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="newBase.text_understanding_model" class="col-span-3">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectTextModel')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in textUnderstandingModelOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 图像理解模型 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="image_understanding_model">{{ t("rag.sidebar.imageUnderstandingModel") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="newBase.image_understanding_model" class="col-span-3">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectImageModel')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in imageUnderstandingModelOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 重排序启用 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="rerank_enabled">{{ t("rag.sidebar.rerankEnabled") }}</Label>
            <Checkbox id="rerank_enabled" v-model="newBase.rerank_enabled" />
          </div>
          
          <!-- 重排序模型 -->
          <div class="grid grid-cols-4 items-center gap-4" v-if="newBase.rerank_enabled">
            <Label class="text-right" for="rerank_model">{{ t("rag.sidebar.rerankModel") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="newBase.rerank_model" class="col-span-3">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectRerankModel')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in rerankModelOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
        
        <!--  -->
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeCreateDialog">{{
          t("common.cancel")
        }}</Button>
        <Button :disabled="createLoading" @click="handleCreateBase">
          <Loader2 v-if="createLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.create") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 编辑知识库对话框 -->
  <Dialog :open="showEditDialog" @update:open="closeEditDialog">
    <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t("rag.sidebar.editBase") }}</DialogTitle>
        <DialogDescription>
          {{ t("rag.sidebar.editBaseDesc") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-2">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-title">{{ t("rag.sidebar.title") }}</Label>
          <Input id="edit-title" v-model="editBase.title" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-description">{{
            t("rag.sidebar.description")
          }}</Label>
          <Textarea
            id="edit-description"
            v-model="editBase.description"
            class="col-span-3"
          />
        </div>
        
        <!-- 嵌入模型类型 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-embedding_model_type">{{ t("rag.sidebar.embeddingModelType") }}</Label>
          <div class="col-span-3 w-full">
            <Select v-model="editBase.embedding_model_type" class="col-span-3">
              <SelectTrigger>
                <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingModelType')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in embeddingModelTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <!-- 嵌入模型 -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-embedding_model">{{ t("rag.sidebar.embeddingModel") }}</Label>
          <div class="col-span-3 w-full">
            <Select v-model="editBase.embedding_model" class="col-span-3">
              <SelectTrigger>
                <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingModel')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in embeddingModelOptions" :key="option.value" :value="option.value">
                  {{ option.label }} ({{ option.value }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right text-zinc-500" for="edit-moreConfig"></Label>
          <div @click="isShowMoreConfig = !isShowMoreConfig" class="flex cursor-pointer text-sm text-zinc-500 items-center space-x-2"> 
            <span>{{ t("rag.sidebar.moreConfig") }}</span> 
            <ChevronDown v-if="!isShowMoreConfig" class="size-4" /> 
            <ChevronUp v-else class="size-4" /> 
          </div> 
        </div>
        
        <!-- 更多配置（折叠部分） -->
        <div v-if="isShowMoreConfig" class="py-2 grid gap-4">
          <!-- 分块方法 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-chunk_method">{{ t("rag.sidebar.chunkMethod") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="editBase.chunk_method">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectChunkMethod')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in chunkMethodOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 分块大小 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-chunk_size">{{ t("rag.sidebar.chunkSize") }}</Label>
            <Input id="edit-chunk_size" type="number" v-model="editBase.chunk_size" class="col-span-3" />
          </div>
          
          <!-- 分块重叠 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-chunk_overlap">{{ t("rag.sidebar.chunkOverlap") }}</Label>
            <Input id="edit-chunk_overlap" type="number" v-model="editBase.chunk_overlap" class="col-span-3" />
          </div>
          
          <!-- 嵌入维度 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-embedding_dimension">{{ t("rag.sidebar.embeddingDimension") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="editBase.embedding_dimension">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectEmbeddingDimension')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in embeddingDimensionOptions" :key="option.value" :value="String(option.value)">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 文本理解模型 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-text_understanding_model">{{ t("rag.sidebar.textUnderstandingModel") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="editBase.text_understanding_model" class="col-span-3">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectTextModel')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in textUnderstandingModelOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 图像理解模型 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-image_understanding_model">{{ t("rag.sidebar.imageUnderstandingModel") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="editBase.image_understanding_model" class="col-span-3">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectImageModel')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in imageUnderstandingModelOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <!-- 重排序启用 -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right" for="edit-rerank_enabled">{{ t("rag.sidebar.rerankEnabled") }}</Label>
            <Checkbox id="edit-rerank_enabled" v-model="editBase.rerank_enabled" />
          </div>
          
          <!-- 重排序模型 -->
          <div class="grid grid-cols-4 items-center gap-4" v-if="editBase.rerank_enabled">
            <Label class="text-right" for="edit-rerank_model">{{ t("rag.sidebar.rerankModel") }}</Label>
            <div class="col-span-3 w-full">
              <Select v-model="editBase.rerank_model" class="col-span-3">
                <SelectTrigger>
                  <SelectValue :placeholder="t('rag.sidebar.selectRerankModel')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in rerankModelOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right" for="edit-is_default">{{
            t("rag.sidebar.isDefault")
          }}</Label>
          <Checkbox id="edit-is_default" v-model="editBase.is_default" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeEditDialog">{{
          t("common.cancel")
        }}</Button>
        <Button :disabled="editLoading" @click="handleUpdateBase">
          <Loader2 v-if="editLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Sidebar :collapsible="props.collapsible" class="hidden flex-1 md:flex absolute">
    <SidebarHeader class="gap-3.5 border-b p-4 h-[64px]">
      <div class="flex w-full items-center justify-between">
        <div class="text-base font-medium text-foreground">
          {{ t("rag.sidebar.title") }}
        </div>
        <Label class="flex items-center gap-2 text-sm">
          <Button size="sm" class="font-bold" @click="openCreateDialog">
            <Plus class="w-4 h-4" />{{ t("rag.sidebar.create") }}
          </Button>
        </Label>
      </div>
      <!-- <SidebarInput placeholder="搜索知识库..." /> -->
    </SidebarHeader>
    <SidebarContent>
      <ScrollArea
        class="w-full h-fulll"
        :class="envStore.isWeb ? 'h-[calc(100dvh-64px-30px)]' : 'h-[calc(100dvh-64px)]'"
      >
        <div v-if="ragStore.loadingBases" class="flex justify-center py-4">
          <Loader2 class="h-6 w-6 animate-spin" />
        </div>
        <div
          v-else-if="knowledgeBases.length === 0"
          class="px-4 py-2 text-center text-muted-foreground text-sm mt-4"
        >
          {{ t("rag.sidebar.noKnowledgeBases") }}
        </div>
        <template v-for="base in knowledgeBases" :key="base.id">
          <div
            @click="handleFolderChange(base)"
            class="group/item text-sm cursor-pointer flex justify-between items-center px-4 pr-0 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            :class="
              base.id === activeFolderId
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : ''
            "
          >
            <div class="flex items-center justify-between w-full">
              <div>
                <div class="flex items-center">
                  <FolderOpen class="mr-2 h-4 w-4" />
                  <span>{{ base.title }}</span>
                  <Star v-if="base.is_default" class="ml-2 h-3 w-3 text-yellow-400" />
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ base.document_count || 0 }} {{ t("rag.sidebar.documents") }}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" class="invisible group-hover/item:visible">
                    <EllipsisVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right">
                  <DropdownMenuItem @click="openEditDialog(base)">
                    <Settings class="mr-2 h-4 w-4" />
                    {{ t("rag.sidebar.edit") }}
                  </DropdownMenuItem>
                  <!-- <DropdownMenuItem v-if="!base.is_default" @click="setDefaultBase(base)">
                    <Star class="mr-2 h-4 w-4" />
                    {{ t("rag.sidebar.setDefault") }}
                  </DropdownMenuItem> -->
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleRemoveFolder(base)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    {{ t("rag.sidebar.delete") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </template>
        <ScrollBar />
      </ScrollArea>
    </SidebarContent>
  </Sidebar>
</template>
