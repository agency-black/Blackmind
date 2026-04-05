<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-vue-next"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ref, onMounted, computed } from "vue"
import { SquareArrowOutUpRight, PlusCircle, RefreshCw, Edit, Trash2, Play, Square } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import mcpMock from '@/api/mcpMock.json'
import { Settings, Terminal, FileText } from "lucide-vue-next"
import Env from "@/components/mcp/Env.vue"
import Config from "@/components/mcp/Config.vue"
import AddNew from "@/components/mcp/AddNew.vue"
import { Toaster } from '@/components/ui/toast'
import { useMcpStore } from '@/stores/mcp'
import { useToast } from "@/components/ui/toast/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// 使用MCP store
const mcpStore = useMcpStore()
const { toast } = useToast()
const { t, locale } = useI18n()

// 获取多语言名称的计算属性
const getDisplayName = (item: any) => {
  // 中文环境使用ChineseName，其他语言使用Name
  if (locale.value === 'zh' || locale.value === 'zh-CN') {
    return item.chineseName || item.ChineseName || item.name || item.Name || item.key
  } else {
    return item.name || item.Name || item.chineseName || item.ChineseName || item.key
  }
}

// 获取多语言描述的计算属性
const getDisplayDescription = (item: any) => {
  if (locale.value === 'zh' || locale.value === 'zh-CN') {
    return item.AbstractCN || item.Abstract
  } else {
    return item.Abstract || item.AbstractCN
  }
}

// 分类列表
const categories = ref([
  {
    title: t('mcp.recommendedApps'),
    value: 'recommended'
  },
  ...mcpMock.FiledAgg.Category.map(cat => ({
    title: cat.Value,
    value: cat.Value,
    count: cat.Count
  }))
])

// MCP 列表
const mcpList = ref(mcpMock.McpServer.McpServers)
// 添加搜索功能
const searchQuery = ref("")

// 修改过滤逻辑，将原来的 filteredMcpList 改为计算属性
const filteredMcpList = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  let filtered = mcpList.value
  
  // 按分类过滤
  // if (activeCategory.value !== 'recommended') {
  //   filtered = filtered.filter(item => item.Category === activeCategory.value)
  // }
  
  // 按搜索词过滤
  if (query) {
    filtered = filtered.filter(item => {
      const nameMatch = getDisplayName(item).toLowerCase().includes(query)
      // const descMatch = getDisplayDescription(item).toLowerCase().includes(query)
      // return nameMatch || descMatch
      return nameMatch
    })
  }
  
  return filtered
})

// 添加搜索处理函数
const handleSearchChange = (value: string) => {
  searchQuery.value = value
}

// 修改分类切换处理函数
const handleCategoryChange = (value: string) => {
  // activeCategory.value = value
  // 移除原来的手动过滤逻辑，因为现在使用计算属性
}

// 处理安装
const handleInstall = (mcp) => {
  console.log('安装', mcp)
}

// 当前选中的MCP信息
const selectedMcp = ref(null)
const showAddNewDialog = ref(false)

// 处理添加新应用
const handleAddNew = () => {
  mcpStore.openAddNewDialog() // 使用store打开弹窗，不传MCP参数
}

// 打开AddNew对话框并传递MCP信息
const openAddNewWithMcp = (mcp) => {
  // 判断是编辑模式还是安装模式
  const isEditing = mcp.key !== undefined; // 已安装的MCP有key属性
  
  mcpStore.openAddNewDialog({
    ...mcp,
    isEditing: isEditing // 根据来源设置编辑模式标志
  })
}

// 刷新服务器列表
const refreshServers = async () => {
  try {
    await mcpStore.refreshServers()
    toast({
      title: t('mcp.messages.refreshSuccess'),
      description: t('mcp.messages.refreshSuccessDesc'),
    })
  } catch (error) {
    toast({
      title: t('mcp.messages.refreshFailed'),
      description: (error as Error).message || t('mcp.messages.unknownError'),
      variant: "destructive",
    })
  }
}

// 组件挂载时获取已安装的MCP服务器列表
onMounted(async () => {
  await mcpStore.fetchInstalledServers()
})

// 删除确认对话框状态
const showDeleteDialog = ref(false)
const mcpToDelete = ref(null)

// 处理删除MCP
const handleDelete = (mcp) => {
  mcpToDelete.value = mcp
  showDeleteDialog.value = true
}

// 确认删除MCP
const confirmDelete = async () => {
  if (!mcpToDelete.value) return
  
  try {
    await mcpStore.deleteMcpServer((mcpToDelete.value as any).key)
    const displayName = getDisplayName(mcpToDelete.value)
    toast({
      title: t('mcp.messages.deleteSuccess'),
      description: t('mcp.messages.deleteSuccessDesc', { name: displayName }),
    })
    showDeleteDialog.value = false
    mcpToDelete.value = null
  } catch (error) {
    toast({
      title: t('mcp.messages.deleteFailed'),
      description: (error as Error).message || t('mcp.messages.unknownError'),
      variant: "destructive",
    })
  }
}

// 取消删除
const cancelDelete = () => {
  showDeleteDialog.value = false
  mcpToDelete.value = null
}

// 处理启动/停止MCP服务器
// 在 script 部分添加 loadingMcps 状态管理
const loadingMcps = ref<Record<string, boolean>>({}) // 记录每个MCP的loading状态

// 修改处理启动/停止MCP服务器的方法
const toggleServerStatus = async (mcp) => {
  try {
    // 设置当前MCP的loading状态为true
    loadingMcps.value[mcp.key] = true
    
    const displayName = getDisplayName(mcp)
    
    if (mcp.status === 'running') {
      await mcpStore.stopMcpServer(mcp.key)
      toast({
        title: t('mcp.messages.stopSuccess'),
        description: t('mcp.messages.stopSuccessDesc', { name: displayName }),
      })
    } else {
      await mcpStore.startMcpServer(mcp.key)
      toast({
        title: t('mcp.messages.startSuccess'),
        description: t('mcp.messages.startSuccessDesc', { name: displayName }),
      })
    }
    // 刷新服务器列表
    await mcpStore.refreshServers()
  } catch (error) {
    toast({
      title: mcp.status === 'running' ? t('mcp.messages.stopFailed') : t('mcp.messages.startFailed'),
      description: (error as Error).message || t('mcp.messages.unknownError'),
      variant: "destructive",
    })
  } finally {
    // 操作完成后，重置loading状态
    loadingMcps.value[mcp.key] = false
  }
}

const opendoc = () => {
  window.open('https://docs.ee.chat/mcp/about.html')
}
</script>

<template>
  <div class="mx-auto h-[100vh] max-[100vh] px-4 max-sm:px-4 flex flex-col overflow-hidden">
    <!-- 修改标题部分 -->
    <div class="flex justify-between items-center">
      <div>
        <div class="font-bold pt-6 text-2xl">{{ t('mcp.title') }}</div>
        <div class="mt-2 text-sm text-gray-400">
          {{ t('mcp.subtitle') }}
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <Config></Config>
        <Env></Env>
        <Button variant="outline" @click="opendoc">
          <FileText/>
          {{ t('mcp.helpDoc') }}
        </Button>
      </div>
    </div>

    <ScrollArea class="h-[calc(100dvh-130px)]">
    <!-- 调整已安装部分布局 -->
    <div class="mt-6">
      <div class="font-medium mb-3 flex justify-between">
        <h3>{{ t('mcp.installedApps') }}</h3>
        <div class="flex items-center space-x-2">
          <Button variant="outline" size="sm" @click="refreshServers" :disabled="mcpStore.loadingServers">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': mcpStore.loadingServers }" />
            {{ t('mcp.refresh') }}
          </Button>
        </div>
      </div>
      
      <AddNew></AddNew>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 添加新应用卡片 -->
        <div class="rounded-md border overflow-hidden cursor-pointer hover:border-primary flex flex-col justify-center bg-background min-h-[180px]" @click="handleAddNew">
          <div class="flex flex-col items-center justify-center">
            <PlusCircle class="w-8 h-8 mb-2" />
            <span class="text-sm">{{ t('mcp.addNewApp') }}</span>
          </div>
        </div>

        <!-- 使用store中的数据 -->
        <div 
          v-for="item in mcpStore.installedServers" 
          :key="item.key"
          class="rounded-md border overflow-hidden bg-background"
        >
          <div class="font-bold p-4 flex justify-between items-center">
            <span>{{ getDisplayName(item) }}</span>
            <Badge :variant="item.status === 'running' ? 'default' : 'secondary'">
              {{ item.status === 'running' ? t('mcp.status.running') : t('mcp.status.stopped') }}
            </Badge>
          </div>
          <Separator></Separator>
          <div class="p-4 relative">
            <div class="text-sm line-clamp-3 text-zinc-500 min-h-16">{{ getDisplayDescription(item) }}</div>
            <div class="flex justify-between items-center mt-2">
              <div class="flex items-center">
                <!-- 启动/停止按钮 -->
                <Button 
                  variant="ghost" 
                  size="icon" 
                  @click="toggleServerStatus(item)" 
                  :title="item.status === 'running' ? t('mcp.actions.stop') : t('mcp.actions.start')"
                  :disabled="loadingMcps[item.key]"
                >
                  <!-- 显示loading状态 -->
                  <RefreshCw v-if="loadingMcps[item.key]" class="w-4 h-4 animate-spin" />
                  <!-- 非loading状态下显示播放或停止图标 -->
                  <Play v-else-if="item.status !== 'running'" class="w-4 h-4 fill-primary" />
                  <Square v-else class="w-4 h-4 fill-primary-foreground" />
                </Button>
              </div>
              <div class="flex items-center space-x-1">
                <!-- 编辑按钮 -->
                <Button 
                  variant="ghost" 
                  size="icon" 
                  @click="openAddNewWithMcp(item)" 
                  :title="t('mcp.actions.edit')"
                  class="hover:bg-primary/10 transition-colors"
                >
                  <Edit class="w-4 h-4 text-gray-400 group-hover:text-primary" />
                </Button>
                <!-- 删除按钮 -->
                <Button variant="ghost" size="icon" @click="handleDelete(item)" :title="t('mcp.actions.delete')">
                  <Trash2 class="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 显示无数据状态 -->
        <div v-if="mcpStore.installedServers.length === 0 && !mcpStore.loadingServers" class="col-span-4 text-center py-8 text-muted-foreground">
          {{ t('mcp.noInstalledApps') }}
        </div>
        
        <!-- 显示加载状态 -->
        <div v-if="mcpStore.loadingServers && mcpStore.installedServers.length === 0" class="col-span-4 text-center py-8 text-muted-foreground">
          {{ t('mcp.loadingApps') }}
        </div>
      </div>
    </div>

    <!-- 调整下半部分布局 -->
    <div class=" flex-1 mt-6">
      <div class="font-medium mb-3 flex justify-between">
        <h3>{{ t('mcp.recommendedApps') }}</h3>
        <div class="flex items-center space-x-2">
          <div class="relative max-w-sm items-center flex justify-end w-[220px] pr-[1px]">
            <Input
              id="search"
              type="text"
              :model-value="searchQuery"
              @update:model-value="(payload: string | number) => handleSearchChange(payload.toString())"
              :placeholder="t('discover.searchPlaceholder')"
              class="pl-10 w-[220px] bg-background"
            />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
              <Search class="size-6 text-muted-foreground" />
            </span>
          </div>
          <Button variant="outline">{{ t('mcp.viewMore') }}</Button>
        </div>
      </div>
        <div class="">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="item in filteredMcpList" :key="item.Id" class="rounded-md border overflow-hidden bg-background">
              <!-- 卡片内容保持不变 -->
              <div class="font-bold p-4">
                {{ getDisplayName(item) }}
              </div>
              <Separator></Separator>
              <div class="p-4 relative">
                <div class="text-sm line-clamp-3 text-zinc-500">{{ getDisplayDescription(item) }}</div>
                <div class="flex justify-between items-center mt-4">
                  <div class="flex items-center">
                    <Badge variant="outline">
                      <span class="">{{ item.FromSite }}</span>
                    </Badge>
                  </div>
                  <Button 
                    @click="openAddNewWithMcp(item)" 
                    variant="ghost" 
                    size="icon"
                    :title="t('mcp.actions.install')"
                    class="hover:bg-primary/10 transition-colors"
                  >
                    <SquareArrowOutUpRight class="w-4 h-4 text-gray-400 hover:text-primary"></SquareArrowOutUpRight>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </ScrollArea>
  
  <!-- 删除确认对话框 -->
  <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('mcp.dialog.confirmDelete') }}</DialogTitle>
        <DialogDescription>
          {{ t('mcp.dialog.confirmDeleteDesc', { name: getDisplayName(mcpToDelete) }) }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelDelete">{{ t('mcp.dialog.cancel') }}</Button>
        <Button variant="destructive" @click="confirmDelete">{{ t('mcp.dialog.delete') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  </div>
</template>