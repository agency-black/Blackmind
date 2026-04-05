<script setup>
import { Button } from "@/components/ui/button"
import { Settings, Terminal, FileText, Download, AlertCircle, RefreshCw } from "lucide-vue-next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const binPath = ref('')
const dialogOpen = ref(false)

const getBinPath = async () => {
  const paths = await window.ipcRenderer.invoke('get-app-paths')
  binPath.value = paths.executable
}

const openBinDirectory = async () => {
  await window.ipcRenderer.invoke('open-directory', binPath.value)
}

const tools = ref([
  { 
    name: 'bun', 
    installed: false, 
    downloading: false,
    filename: ''
  },
  { 
    name: 'uv', 
    installed: false, 
    downloading: false,
    filename: ''
  },
])

// 计算工具描述
const getToolDescription = (toolName) => {
  return t(`mcp.env.tools.${toolName}.description`)
}

// 计算未安装工具的提示文本
const manualInstallTip = computed(() => {
  const uninstalledTools = tools.value
    .filter(t => !t.installed)
    .map(t => t.filename)
    .join('、')
  return t('mcp.env.manualInstallTip', { tools: uninstalledTools })
})

// 获取工具文件名
const getToolFilename = async (tool) => {
  try {
    tool.filename = await window.ipcRenderer.invoke('get-tool-filename', tool.name)
  } catch (error) {
    console.error(`获取工具文件名失败: ${tool.name}`, error)
  }
}

// 检测所有工具状态
const checkAllTools = async () => {
  await getBinPath()
  for (const tool of tools.value) {
    await getToolFilename(tool)
    await checkTool(tool.name)
  }
}

// 对话框打开时的处理函数
const handleDialogOpen = (open) => {
  dialogOpen.value = open
  if (open) {
    // 对话框打开时检测工具状态
    checkAllTools()
  }
}

onMounted(async () => {
  // 初始化时获取一次工具状态
  await checkAllTools()
})

const checkTool = async (name) => {
  try {
    const result = await window.ipcRenderer.invoke('check-tool', name)
    const tool = tools.value.find(t => t.name === name)
    if (tool) {
      tool.installed = result
    }
  } catch (error) {
    console.error(`检查工具 ${name} 失败:`, error)
  }
}

const downloadTool = async (tool) => {
  try {
    tool.downloading = true
    await window.ipcRenderer.invoke('download-tool', tool.name)
    await checkTool(tool.name)
  } catch (error) {
    console.error(`下载工具 ${tool.name} 失败:`, error)
  } finally {
    tool.downloading = false
  }
}
</script>

<template>
  <Dialog @update:open="handleDialogOpen">
    <DialogTrigger asChild>
      <Button variant="outline">
        <Terminal />
        {{ t('mcp.env.title') }}
        <AlertCircle 
          v-if="tools.some(t => !t.installed)" 
          class=" text-red-500" 
        />
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t('mcp.env.dialogTitle') }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div v-for="tool in tools" :key="tool.name" class="flex flex-col gap-1 px-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Terminal class="w-4 h-4" />
              <span class="font-medium">{{ tool.name }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span :class="tool.installed ? 'text-green-500' : 'text-red-500'">
                {{ tool.installed ? t('mcp.env.status.installed') : t('mcp.env.status.notInstalled') }}
              </span>
              <Button 
                v-if="!tool.installed"
                variant="outline" 
                size="sm"
                :disabled="tool.downloading"
                @click="downloadTool(tool)"
              >
                <Download v-if="!tool.downloading" class="w-4 h-4 mr-1" />
                <RefreshCw v-else class="animate-spin"></RefreshCw>
                {{ tool.downloading ? t('mcp.env.actions.downloading') : t('mcp.env.actions.download') }}
              </Button>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">{{ getToolDescription(tool.name) }}</p>
        </div>

        <div class="px-4 pt-2 border-t">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">{{ t('mcp.env.installDirectory') }}</span>
            <Button variant="outline" size="sm" @click="openBinDirectory">
              <FileText class="w-4 h-4 mr-1" />
              {{ t('mcp.env.actions.openDirectory') }}
            </Button>
          </div>
          <p class="text-sm mt-1 text-muted-foreground break-all">{{ binPath }}</p>
          <p v-if="tools.some(t => !t.installed)" class="text-xs mt-1 text-muted-foreground">
            {{ manualInstallTip }}
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>