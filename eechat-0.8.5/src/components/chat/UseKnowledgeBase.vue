<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Button } from "@/components/ui/button"
import { BookOpen, RefreshCw } from "lucide-vue-next"
import { ScrollArea } from "@/components/ui/scroll-area" 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { useRagStore } from '@/stores/rag'
import type { RagResponse } from '@/types/rag'

// 使用 Rag store
const ragStore = useRagStore()
const emit = defineEmits(['selectBase', 'selectBases'])

// 从 store 中获取知识库列表和加载状态
const bases = computed(() => ragStore.bases)
const loading = computed(() => ragStore.loadingBases)

// 选中的知识库列表
const selectedBases = ref<number[]>([])

// 加载知识库列表
const loadBases = async () => {
  try {
    await ragStore.fetchBases()
  } catch (error) {
    console.error('加载知识库失败:', error)
  }
}

// 选择知识库
const selectBase = (baseId: number) => {
  // 检查知识库是否已经被选中
  const index = selectedBases.value.indexOf(baseId)
  
  if (index === -1) {
    // 如果未选中，则添加到选中列表
    selectedBases.value.push(baseId)
  } else {
    // 如果已选中，则从选中列表中移除
    selectedBases.value.splice(index, 1)
  }
  ragStore.setUsingBases(selectedBases.value)
  console.log(ragStore.usingBases)
}

// 检查知识库是否被选中
const isBaseSelected = (baseId: number) => {
  return selectedBases.value.includes(baseId)
}

// 组件挂载时加载知识库列表
onMounted(() => {
  loadBases()
})
</script>

<template>
  <div class="relative">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" class="ml-auto gap-1.5">
          <BookOpen class="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuLabel class="flex justify-between items-center py-0">
          <span>知识库</span>
          <Button variant="ghost" size="icon" class="p-0" @click="loadBases" :disabled="loading">
            <RefreshCw :class="['size-2', loading ? 'animate-spin' : '']" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea class="h-[200px]">
          <DropdownMenuGroup v-if="bases.length > 0">
            <DropdownMenuItem
              v-for="base in bases"
              :key="base.id"
              @click="selectBase(Number(base.id))"
              :class="{ 'bg-accent': isBaseSelected(Number(base.id)) }"
            >
              <div class="flex items-center justify-between w-full">
                <span>{{ base.title }}</span>
                <span v-if="isBaseSelected(Number(base.id))" class="text-primary">✓</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <div v-else-if="loading" class="py-2 px-4 text-center text-muted-foreground">
            加载中...
          </div>
          <div v-else class="py-2 px-4 text-center text-muted-foreground text-sm h-[100px]">
            没有可用的知识库
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>