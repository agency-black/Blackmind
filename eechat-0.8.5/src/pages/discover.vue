<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import SidebarDiscover from "@/components/discover/SidebarDiscover.vue"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-vue-next"
import LocalModel from "@/components/setting/LocalModel.vue"
import {useRouter} from "vue-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ref, markRaw, onMounted, computed, watch } from "vue"
import { SquareArrowOutUpRight } from "lucide-vue-next"
import { useAssistantStore } from '@/stores/assistant'
import { useI18n } from "vue-i18n"
// 导入新定义的类型
import { DiscoverItem, CategoryOption } from '@/types/discover'

const { t, locale } = useI18n()

const activeMenu = ref({
  label: t("settings.modelSelect.localModel"),
  icon: "HardDrive",
  key: "LocalModel",
  component: markRaw(LocalModel),
})

// 使用ref创建响应式数据列表，添加类型定义
const dataList = ref<DiscoverItem[]>([])
const isLoading = ref(true)

// 缓存键名
const getCacheKey = (lang: string) => `promot_data_cache_${lang}`
const getCacheTimestampKey = (lang: string) => `promot_data_timestamp_${lang}`
// 缓存过期时间（毫秒），这里设置为1小时
const CACHE_EXPIRY = 60 * 60 * 1000

// 在组件挂载时加载JSON数据
onMounted(async () => {
  await loadDataBasedOnLocale()
})

watch(locale, async (newLocale, oldLocale) => {
  if (newLocale !== oldLocale) {
    isLoading.value = true
    await loadDataBasedOnLocale()
    isLoading.value = false
  }
})

const loadDataBasedOnLocale = async () => {
  const lang = locale.value
  const currentCacheKey = getCacheKey(lang)
  const currentCacheTimestampKey = getCacheTimestampKey(lang)

  // 首先尝试从缓存加载数据
  const cachedData = localStorage.getItem(currentCacheKey)
  const cachedTimestamp = localStorage.getItem(currentCacheTimestampKey)

  // 检查缓存是否存在且未过期
  if (cachedData && cachedTimestamp) {
    const timestamp = parseInt(cachedTimestamp)
    const now = Date.now()

    // 如果缓存未过期，直接使用缓存数据
    if (now - timestamp < CACHE_EXPIRY) {
      try {
        dataList.value = JSON.parse(cachedData)
        console.log(`成功从缓存加载数据 (${lang})`)
        isLoading.value = false
        // 在后台更新缓存
        refreshCacheInBackground(lang)
        return
      } catch (error) {
        console.error(`解析缓存数据失败 (${lang}):`, error)
        // 继续尝试从远程或本地加载
      }
    }
  }

  // 如果没有有效缓存，则从远程或本地加载
  await loadData(lang)
  isLoading.value = false
}

// 后台刷新缓存
const refreshCacheInBackground = async (lang: string) => {
  const remoteUrl = lang === 'en-US' ? 'https://download.9tharts.com/assets/promot_en-US.json' : 'https://download.9tharts.com/assets/promot.json'
  const currentCacheKey = getCacheKey(lang)
  const currentCacheTimestampKey = getCacheTimestampKey(lang)
  try {
    // 尝试从远程URL获取数据
    const response = await fetch(remoteUrl)
    if (response.ok) {
      const data = await response.json()
      // 更新缓存
      localStorage.setItem(currentCacheKey, JSON.stringify(data))
      localStorage.setItem(currentCacheTimestampKey, Date.now().toString())
      console.log(`后台更新缓存成功 (${lang})`)
    }
  } catch (error) {
    console.error(`后台更新缓存失败 (${lang}):`, error)
  }
}

// 提取数据加载逻辑为单独的函数
const loadData = async (lang: string) => {
  const remoteUrl = lang === 'en' ? 'https://download.9tharts.com/assets/promot_en.json' : 'https://download.9tharts.com/assets/promot.json'
  const localUrl = lang === 'en' ? '/promot_en.json' : '/promot.json'
  const currentCacheKey = getCacheKey(lang)
  const currentCacheTimestampKey = getCacheTimestampKey(lang)

  try {
    // 首先尝试从远程URL获取数据
    const response = await fetch(remoteUrl)
    if (response.ok) {
      const data = await response.json()
      dataList.value = data
      console.log(`成功从远程加载数据 (${lang})`)

      // 缓存数据
      localStorage.setItem(currentCacheKey, JSON.stringify(data))
      localStorage.setItem(currentCacheTimestampKey, Date.now().toString())
      console.log(`数据已缓存到本地 (${lang})`)
    } else {
      throw new Error(`远程数据获取失败 (${lang})`)
    }
  } catch (error) {
    console.error(`远程数据获取失败，尝试加载本地数据 (${lang}):`, error)
    try {
      // 远程获取失败，尝试从本地获取
      const localResponse = await fetch(localUrl)
      const localData = await localResponse.json()
      dataList.value = localData
      console.log(`成功从本地文件加载数据 (${lang})`)
    } catch (localError) {
      console.error(`本地数据加载也失败 (${lang}):`, localError)
    }
  }
}

// 提取数据过滤逻辑为单独的函数
const filterData = async (values) => {
  const lang = locale.value
  const remoteUrl = lang === 'en' ? 'https://download.9tharts.com/assets/promot_en.json' : 'https://download.9tharts.com/assets/promot.json'
  const localUrl = lang === 'en' ? '/promot_en.json' : '/promot.json'
  const currentCacheKey = getCacheKey(lang)

  try {
    let data = []
    // 首先尝试从缓存获取数据
    const cachedData = localStorage.getItem(currentCacheKey)
    if (cachedData) {
      try {
        data = JSON.parse(cachedData)
        console.log(`使用缓存数据进行过滤 (${lang})`)
      } catch (error) {
        console.error(`解析缓存数据失败 (${lang}):`, error)
        // 如果缓存解析失败，继续尝试从远程或本地加载
      }
    }

    // 如果没有缓存数据，则从远程或本地加载
    if (data.length === 0) {
      try {
        const response = await fetch(remoteUrl)
        if (response.ok) {
          data = await response.json()
        } else {
          throw new Error(`远程数据获取失败 (${lang})`)
        }
      } catch (error) {
        console.error(`远程数据获取失败，尝试加载本地数据 (${lang}):`, error)
        const localResponse = await fetch(localUrl)
        data = await localResponse.json()
      }
    }
    
    dataList.value = data.filter((item) => {
      // @ts-ignore
      return values.some((value) => item.tags.includes(value.value))
    })
  } catch (error) {
    console.error('过滤数据失败:', error)
  }
}

const catList = [
  {
    title: t('discover.categories.all'),
    key: "全部",
  },
  {
    title: t('discover.categories.translation'),
    key: "翻译",
  },
  {
    title: t('discover.categories.programming'),
    key: "编程",
  },
  {
    title: t('discover.categories.education'),
    key: "教育",
  },
]

// 添加搜索和过滤功能
const searchQuery = ref("")
const selectedCategories = ref<CategoryOption[]>(["all"])
const typeCategories = computed<CategoryOption[]>(() => {
  // 从数据中提取所有不重复的类型
  const types = new Set<CategoryOption>()
  types.add("all") // 添加"全部"选项
  
  dataList.value.forEach(item => {
    if (item.type) {
      types.add(item.type)
    }
  })
  
  return Array.from(types)
})

// 过滤后的列表
const filteredDiscoverList = computed<DiscoverItem[]>(() => {
  const query = searchQuery.value.toLowerCase().trim()
  let filtered = dataList.value
  
  // 按分类过滤
  if (!selectedCategories.value.includes("all")) {
    filtered = filtered.filter(item => 
      selectedCategories.value.includes(item.type || "")
    )
  }
  
  // 按搜索词过滤
  if (query) {
    filtered = filtered.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(query) || false
      const descMatch = item.description?.toLowerCase().includes(query) || false
      return titleMatch || descMatch
    })
  }
  
  return filtered
})

// 处理分类选择变化
const handleCategoryChange = (value: CategoryOption) => {
  selectedCategories.value = [value]
}

// 处理搜索变化
const handleSearchChange = (value: string) => {
  searchQuery.value = value
}

const router = useRouter()
const assistantStore = useAssistantStore()
// 添加类型定义
const handleToChat = (item: DiscoverItem) => {
  assistantStore.setCurrentAssistant(item)
  router.push({
    path: "/",
    query: {
      assistantId: item.title,
    },
  })
}
</script>

<template>
  <div class="flex relative">
    <!-- <SidebarDiscover @change="handleChange"></SidebarDiscover> -->
    <div
      class="mx-auto h-[100vh] w-full px-4 max-sm:px-4 flex flex-col overflow-hidden"
    >
      <div class="font-bold pt-6 text-2xl">{{ t('discover.pageTitle') }}</div>
      <div class="mt-2 text-sm text-gray-400">
        {{ t('discover.pageDescription') }}
      </div>
      <!-- <component class="flex-1" :is="activeMenu.component"></component> -->
      <div class="flex space-x-2 justify-between my-4">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          :model-value="selectedCategories[0]"
          @update:model-value="(value) => handleCategoryChange(value as string)"
        >
          <ToggleGroupItem v-for="category in typeCategories" :key="category" :value="category">
            {{ category === 'all' ? t('discover.categories.all') : category }}
          </ToggleGroupItem>
        </ToggleGroup>

      <div class="relative max-w-sm items-center flex justify-end w-[220px] pr-[1px]">
        <Input
          id="search"
          type="text"
          :model-value="searchQuery"
          @update:model-value="(payload: string | number) => handleSearchChange(payload.toString())"
          :placeholder="t('discover.searchPlaceholder')"
          class="pl-10 w-[220px]"
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
          <Search class="size-6 text-muted-foreground" />
        </span>
      </div>
    </div>
      <ScrollArea class="h-[calc(100dvh-200px)]">
        <div v-if="isLoading" class="py-6 flex justify-center items-center">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <div
          v-else
          class="py-6 flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div v-for="(item, index) in filteredDiscoverList" :key="index" class="rounded-md border overflow-hidden bg-background">
            <div
              class="font-bold p-4 bg-no-repeat bg-cover"
              :style="{
                // backgroundImage: `url(https://avatar.vercel.sh/${item.type})`,
              }"
            >
              {{ item.title }}
            </div>
            <Separator></Separator>
            <div class="p-4 relative">
              <div class="text-sm line-clamp-3">{{ item.description }}</div>
              <div class="flex justify-between items-center bottom-2">
                <div class="flex items-center">
                  <!-- <div
                    class="w-2 h-2 rounded-full"
                    :style="{
                      backgroundImage: `url(https://avatar.vercel.sh/${item.title})`,
                    }"
                  ></div> -->
                  <badge variant="outline">{{item.type}}</badge>
                  <!-- <div class="ml-2 text-sm">{{ item.type }}</div> -->
                </div>
                <!-- <Badge class="mt-2" variant="secondary">{{ item.type }}</Badge> -->
                <Button @click="handleToChat(item)" variant="ghost" size="icon"
                  ><SquareArrowOutUpRight class="text-gray-400"></SquareArrowOutUpRight
                ></Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
