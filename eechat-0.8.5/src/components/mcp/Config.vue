<script setup>
import { Button } from "@/components/ui/button"
import { Settings, Save, RefreshCw } from "lucide-vue-next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { ref, onMounted } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Toaster } from '@/components/ui/toast'
import MonacoEditor from "@/components/common/MonacoEditor.vue"
import { useMcpStore } from "@/stores/mcp"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const mcpStore = useMcpStore()
const { toast } = useToast()

const configPath = ref('')
const configFilePath = ref('')
const configContent = ref('')
const originalContent = ref('')
const dialogOpen = ref(false)
const loading = ref(false)
const saving = ref(false)
const editorRef = ref(null)

// 获取配置文件路径
const getConfigPath = async () => {
  try {
    const paths = await window.ipcRenderer.invoke('get-app-paths')
    configPath.value = paths.config
    configFilePath.value = await window.ipcRenderer.invoke('get-mcp-config-path')
    return paths.config
  } catch (error) {
    console.error('获取配置路径失败:', error)
    toast({
      title: t('mcp.config.messages.pathFailed'),
      description: t('mcp.config.messages.pathFailedDesc'),
      variant: "destructive",
    })
  }
}

// 加载配置文件内容
const loadConfigFile = async () => {
  try {
    loading.value = true
    const path = await getConfigPath()
    const content = await window.ipcRenderer.invoke('read-mcp-config')
    configContent.value = content
    originalContent.value = content
  } catch (error) {
    console.error('加载配置文件失败:', error)
    toast({
      title: t('mcp.config.messages.loadFailed'),
      description: t('mcp.config.messages.loadFailedDesc'),
      variant: "destructive",
    })
  } finally {
    loading.value = false
  }
}

// 格式化JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(configContent.value)
    configContent.value = JSON.stringify(parsed, null, 2)
    if (editorRef.value) {
      editorRef.value.formatCode()
    }
  } catch (e) {
    toast({
      title: t('mcp.config.messages.formatError'),
      description: t('mcp.config.messages.formatErrorDesc'),
      variant: "destructive",
    })
  }
}

// 保存配置文件
const saveConfigFile = async () => {
  try {
    saving.value = true
    
    // 验证JSON格式
    try {
      JSON.parse(configContent.value)
    } catch (e) {
      toast({
        title: t('mcp.config.messages.formatError'),
        description: t('mcp.config.messages.formatErrorSave'),
        variant: "destructive",
      })
      saving.value = false
      return
    }
    
    await window.ipcRenderer.invoke('save-mcp-config', configContent.value)
    originalContent.value = configContent.value
    
    try {
      toast({
        title: t('mcp.config.messages.saveSuccess'),
        description: t('mcp.config.messages.saveSuccessDesc'),
      })
      const res = await mcpStore.restartServer()
      const desStr = res.details.failedServers.map(server => `${server.key}: ${server.error}`).join('，  \n')
      mcpStore.fetchTools()
      toast({
        title: res.message,
        description: desStr ? desStr : t('mcp.config.messages.restartSuccess'),
      })
      dialogOpen.value = false
    } catch (error) {
      toast({
        title: t('mcp.config.messages.restartFailed'),
        description: error.message || t('mcp.config.messages.restartFailed'),
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error('保存配置文件失败:', error)
    toast({
      title: t('mcp.config.messages.saveFailed'),
      description: error.message || t('mcp.config.messages.saveFailedDesc'),
      variant: "destructive",
    })
  } finally {
    saving.value = false
  }
}

// 重置配置
const resetConfig = () => {
  configContent.value = originalContent.value
}

// 对话框打开时的处理函数
const handleDialogOpen = (open) => {
  dialogOpen.value = open
  if (open) {
    loadConfigFile()
  }
}

// 打开配置文件目录
const openConfigDirectory = async () => {
  await window.ipcRenderer.invoke('open-directory', configPath.value)
}

onMounted(async () => {
  await getConfigPath()
})
</script>

<template>
  <Dialog @update:open="handleDialogOpen">
    <DialogTrigger asChild>
      <Button>
        <Settings />
        {{ t('mcp.config.button') }}
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>{{ t('mcp.config.title') }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div v-if="loading" class="flex justify-center items-center py-8">
          <RefreshCw class="w-6 h-6 animate-spin" />
          <span class="ml-2">{{ t('mcp.config.loading') }}</span>
        </div>
        <div v-else>
          <div class="relative rounded overflow-hidden">
            <MonacoEditor
              ref="editorRef"
              v-model="configContent"
              language="json"
              :theme="'vs-dark'"
              height="60dvh"
              :options="{
                formatOnPaste: true,
                formatOnType: true,
                autoIndent: true
              }"
            />
          </div>
        </div>
        <div class="flex items-center justify-between mt-4 space-x-4">
          <div>
            <span class="text-sm text-muted-foreground break-all">{{ configFilePath }}</span>
          </div>
          <div class="flex space-x-2">
            <Button variant="outline" size="sm" @click="openConfigDirectory">
              {{ t('mcp.config.buttons.openDirectory') }}
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="resetConfig" :disabled="loading || saving">
          {{ t('mcp.config.buttons.reset') }}
        </Button>
        <Button variant="outline" @click="formatJson" :disabled="loading || saving">
          {{ t('mcp.config.buttons.format') }}
        </Button>
        <Button @click="saveConfigFile" :disabled="loading || saving">
          <Save v-if="!saving" class="w-4 h-4" />
          <RefreshCw v-else class="w-4 h-4 animate-spin" />
          {{ saving ? t('mcp.config.buttons.saving') : t('mcp.config.buttons.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Toaster />
</template>
