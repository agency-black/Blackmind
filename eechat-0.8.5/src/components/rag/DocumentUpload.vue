<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast/use-toast'
import { useRagStore } from '@/stores/rag'
import { useDocumentStore } from '@/stores/documentStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Upload,
  File,
  FileText,
  FilePlus,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next'

const { t } = useI18n()
const { toast } = useToast()
const ragStore = useRagStore()
const documentStore = useDocumentStore()

// 上传对话框状态
const showUploadDialog = ref(false)
const uploadProgress = ref(0)
const uploading = ref(false)
const uploadComplete = ref(false)
const uploadError = ref(false)
const errorMessage = ref('')

// 文件列表
const selectedFiles = ref<File[]>([])

// 支持的文件类型
const supportedFileTypes = [
  '.pdf', '.docx', '.doc', '.txt', '.md', '.csv', 
  '.xlsx', '.xls', '.pptx', '.ppt', '.html', '.json'
]

// 文件类型过滤器
const fileTypeFilter = computed(() => supportedFileTypes.join(','))

// 打开上传对话框
const openUploadDialog = () => {
  showUploadDialog.value = true
  resetUploadState()
}

// 关闭上传对话框
const closeUploadDialog = () => {
  if (uploading.value) return // 上传中不允许关闭
  showUploadDialog.value = false
  resetUploadState()
}

// 重置上传状态
const resetUploadState = () => {
  selectedFiles.value = []
  uploadProgress.value = 0
  uploading.value = false
  uploadComplete.value = false
  uploadError.value = false
  errorMessage.value = ''
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  addFiles(files)
}

// 添加文件到列表
const addFiles = (files) => {
  // 过滤不支持的文件类型
  const validFiles = files.filter(file => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    return supportedFileTypes.includes(extension)
  })
  
  // 添加到已选文件列表
  selectedFiles.value = [...selectedFiles.value, ...validFiles]
  
  // 如果有不支持的文件，显示提示
  if (validFiles.length < files.length) {
    toast({
      title: t('rag.document.unsupportedFileType'),
      description: t('rag.document.unsupportedFileTypeDesc'),
      variant: 'destructive'
    })
  }
}

// 移除文件
const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

// 处理拖拽区域
const dragover = ref(false)
const handleDragOver = (e) => {
  e.preventDefault()
  dragover.value = true
}
const handleDragLeave = () => {
  dragover.value = false
}
const handleDrop = (e) => {
  e.preventDefault()
  dragover.value = false
  if (e.dataTransfer.files.length > 0) {
    addFiles(Array.from(e.dataTransfer.files))
  }
}

// 获取文件图标
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return FileText
    case 'doc':
    case 'docx':
      return FileText
    case 'xls':
    case 'xlsx':
      return FileText
    case 'ppt':
    case 'pptx':
      return FileText
    default:
      return File
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 上传文件
const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) {
    toast({
      title: t('rag.document.noFilesSelected'),
      description: t('rag.document.pleaseSelectFiles'),
      variant: 'destructive'
    })
    return
  }
  
  if (!ragStore.selectedBase) {
    toast({
      title: t('rag.document.noBaseSelected'),
      description: t('rag.document.pleaseSelectBase'),
      variant: 'destructive'
    })
    return
  }
  
  uploading.value = true
  uploadError.value = false
  uploadProgress.value = 0
  
  try {
    // 创建FormData对象
    const formData = new FormData()
    selectedFiles.value.forEach(file => {
      formData.append('files', file)
    })
    
    // 上传到当前选中的知识库
    const baseId = ragStore.selectedBase.id
    
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 5
      }
    }, 300)
    
    // 调用上传API
    const result = await documentStore.uploadDocuments(baseId, formData, (progress) => {
      uploadProgress.value = progress
    })
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadComplete.value = true
    
    // 上传成功后刷新文档列表
    await documentStore.fetchDocuments(baseId)
    
    toast({
      title: t('rag.document.uploadSuccess'),
      description: t('rag.document.uploadSuccessDesc', { count: selectedFiles.value.length })
    })
    
    // 2秒后自动关闭对话框
    setTimeout(() => {
      closeUploadDialog()
    }, 2000)
    
  } catch (error) {
    uploadError.value = true
    errorMessage.value = error instanceof Error ? error.message : String(error)
    uploadProgress.value = 0
    
    toast({
      title: t('rag.document.uploadFailed'),
      description: errorMessage.value,
      variant: 'destructive'
    })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <Button @click="openUploadDialog" class="flex items-center gap-2">
      <Upload class="h-4 w-4" />
      {{ t('rag.document.uploadDocument') }}
    </Button>
    
    <Dialog :open="showUploadDialog" @update:open="closeUploadDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('rag.document.uploadDocument') }}</DialogTitle>
          <DialogDescription>
            {{ t('rag.document.uploadDocumentDesc') }}
          </DialogDescription>
        </DialogHeader>
        
        <!-- 上传区域 -->
        <div v-if="!uploading && !uploadComplete" class="grid gap-4">
          <!-- 拖拽上传区域 -->
          <div
            class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
            :class="dragover ? 'border-primary bg-primary/5' : 'border-border'"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <Upload class="h-10 w-10 mx-auto text-muted-foreground" />
            <p class="mt-2 text-sm font-medium">
              {{ t('rag.document.dragAndDrop') }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ t('rag.document.supportedFormats') }}: {{ supportedFileTypes.join(', ') }}
            </p>
            <label class="mt-4 inline-block relative w-[72px] h-[32px] overflow-hidden">
              <Button size="sm" type="button">
                {{ t('rag.document.browseFiles') }}
              </Button>
              <input
                type="file"
                multiple
                class="absolute z-50 left-0 top-0 opacity-0 cursor-pointer"
                :accept="fileTypeFilter"
                @change="handleFileSelect"
              />
            </label>
          </div>
          
          <!-- 已选文件列表 -->
          <div v-if="selectedFiles.length > 0" class="border rounded-md">
            <div class="p-3 border-b">
              <h3 class="text-sm font-medium">
                {{ t('rag.document.selectedFiles') }} ({{ selectedFiles.length }})
              </h3>
            </div>
            <ul class="max-h-[200px] overflow-auto p-2">
              <li
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <component :is="getFileIcon(file.name)" class="h-4 w-4 flex-shrink-0" />
                  <div class="overflow-hidden">
                    <p class="text-sm truncate">{{ file.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6"
                  @click="removeFile(index)"
                >
                  <X class="h-4 w-4" />
                </Button>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 上传进度 -->
        <div v-if="uploading || uploadComplete || uploadError" class="space-y-4">
          <div class="flex items-center justify-center py-4">
            <Loader2 v-if="uploading" class="h-10 w-10 animate-spin text-primary" />
            <CheckCircle v-if="uploadComplete" class="h-10 w-10 text-green-500" />
            <AlertCircle v-if="uploadError" class="h-10 w-10 text-destructive" />
          </div>
          
          <div class="text-center">
            <h3 class="text-lg font-medium">
              <template v-if="uploading">{{ t('rag.document.uploading') }}</template>
              <template v-else-if="uploadComplete">{{ t('rag.document.uploadComplete') }}</template>
              <template v-else-if="uploadError">{{ t('rag.document.uploadFailed') }}</template>
            </h3>
            <p v-if="uploadError" class="text-sm text-destructive mt-1">
              {{ errorMessage }}
            </p>
          </div>
          
          <Progress v-if="uploading || uploadComplete" :value="uploadProgress" class="w-full" />
          
          <p v-if="uploading" class="text-sm text-center text-muted-foreground">
            {{ t('rag.document.uploadingDesc') }}
          </p>
        </div>
        
        <DialogFooter class="mt-4">
          <Button
            variant="outline"
            @click="closeUploadDialog"
            :disabled="uploading"
          >
            {{ uploadComplete ? t('common.close') : t('common.cancel') }}
          </Button>
          <Button
            v-if="!uploading && !uploadComplete"
            @click="uploadFiles"
            :disabled="selectedFiles.length === 0"
          >
            {{ t('rag.document.upload') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>