<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Volume2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import { ttsApi } from '@/api/request'
import { useSpeechStore } from '@/stores/speech'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const { t, locale } = useI18n()
const { toast } = useToast()
const speechStore = useSpeechStore()

const loading = ref(false)
const testLoading = ref(false)
const voices = ref<any[]>([])
const filteredVoices = ref<any[]>([])
const selectedVoice = ref('')
const testText = ref('')

// 获取当前语言的简写（如zh-CN -> zh, en-US -> en）
const currentLangPrefix = computed(() => {
  return locale.value.split('-')[0]
})

// 获取语音列表
const getVoices = async () => {
  try {
    loading.value = true
    const result = await ttsApi.getVoices()
    voices.value = result || []
    
    // 根据当前语言筛选语音
    filterVoicesByLanguage()
    
    // 如果有存储的语音设置，则使用它
    const savedVoice = localStorage.getItem('tts-voice')
    if (savedVoice && voices.value.some(v => v.ShortName === savedVoice)) {
      selectedVoice.value = savedVoice
    } else if (filteredVoices.value.length > 0) {
      // 否则使用当前语言的第一个语音
      selectedVoice.value = filteredVoices.value[0].ShortName
      localStorage.setItem('tts-voice', selectedVoice.value)
    }
  } catch (error: any) {
    toast({
      title: t('settings.tts.getVoicesFailed', '获取语音列表失败'),
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 根据当前语言筛选语音
const filterVoicesByLanguage = () => {
  const prefix = currentLangPrefix.value
  filteredVoices.value = voices.value.filter(voice => 
    voice.Locale.toLowerCase().startsWith(prefix.toLowerCase())
  )
  
  // 如果没有找到当前语言的语音，则显示所有语音
  if (filteredVoices.value.length === 0) {
    filteredVoices.value = voices.value
  }
}

// 选择语音
const handleVoiceChange = (value: string) => {
  selectedVoice.value = value
  localStorage.setItem('tts-voice', value)
}

// 测试语音
const testVoice = async () => {
  if (!selectedVoice.value) {
    toast({
      title: t('settings.tts.selectVoiceFirst', '请先选择语音'),
      variant: 'destructive'
    })
    return
  }
  
  const text = testText.value || t('settings.tts.testText', 'eechat 真棒，我很喜欢。')
  
  try {
    testLoading.value = true
    const result = await ttsApi.textToSpeech(text, selectedVoice.value)
    
    // 创建音频源
    const audioSrc = `data:${result.mimeType};base64,${result.base64Audio}`
    
    // 播放音频
    const audio = new Audio(audioSrc)
    audio.play()
    
    // 更新全局语音状态
    speechStore.startSpeaking(text, 'edge-tts', audioSrc)
    
    // 监听播放结束
    audio.onended = () => {
      speechStore.stopSpeaking()
    }
  } catch (error: any) {
    toast({
      title: t('settings.tts.testFailed', '测试语音失败'),
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    testLoading.value = false
  }
}

// 监听语言变化
watch(locale, () => {
  filterVoicesByLanguage()
  
  // 如果当前选择的语音不在筛选结果中，则选择第一个
  if (filteredVoices.value.length > 0 && 
      !filteredVoices.value.some(v => v.ShortName === selectedVoice.value)) {
    selectedVoice.value = filteredVoices.value[0].ShortName
    localStorage.setItem('tts-voice', selectedVoice.value)
  }
  
  // 更新测试文本
  testText.value = t('settings.tts.testText', 'eechat 真棒，我很喜欢。')
})

onMounted(() => {
  getVoices()
  testText.value = t('settings.tts.testText', 'eechat 真棒，我很喜欢。')
})
</script>

<template>
  <div class="h-full space-y-6">
    <div class="text-gray-500 text-sm">
      {{ t('settings.tts.title', '文本转语音设置') }}
    </div>
    
    <div class="space-y-4">
      <!-- 语音选择 -->
      <div class="space-y-2">
        <Label for="voice-select">{{ t('settings.tts.voice', '语音') }}</Label>
        <div class="flex space-x-2">
          <Select v-model="selectedVoice" @update:modelValue="handleVoiceChange">
            <SelectTrigger class="">
              <SelectValue :placeholder="t('settings.tts.selectVoice', '选择语音')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{{ t('settings.tts.currentLanguageVoices', '当前语言语音') }}</SelectLabel>
                <SelectItem 
                  v-for="voice in filteredVoices" 
                  :key="voice.ShortName" 
                  :value="voice.ShortName"
                >
                  {{ voice.FriendlyName }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button variant="outline" @click="getVoices" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t('settings.tts.refresh', '刷新') }}
          </Button>
        </div>
      </div>
      
      <!-- 测试区域 -->
      <div class="space-y-2">
        <Label for="test-text">{{ t('settings.tts.testTextTitle', '测试文本') }}</Label>
        <div class="flex space-x-2">
          <Input 
            id="test-text" 
            v-model="testText" 
            :placeholder="t('settings.tts.enterTestText', '输入测试文本')"
            class="flex-1 bg-background"
          />
          <Button @click="testVoice" :disabled="testLoading">
            <Loader2 v-if="testLoading" class="mr-2 h-4 w-4 animate-spin" />
            <Volume2 v-else class="mr-2 h-4 w-4" />
            {{ t('settings.tts.test', '测试') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>