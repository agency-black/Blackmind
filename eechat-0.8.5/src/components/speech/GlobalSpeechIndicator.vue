<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useSpeechStore } from '@/stores/speech'

const speechStore = useSpeechStore()

// 计算是否显示指示器
const isVisible = computed(() => {
  return speechStore.isSpeaking
})

// 音频分析相关
let audioContext:any = null
let analyser:any = null
let dataArray:any = null
let animationFrameId:any = null
const frequencyData:any = ref(new Uint8Array(64))
const isInitialized:any = ref(false)

// 初始化音频分析器
const initAudioAnalyser = () => {
  if (isInitialized.value) return
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    
    // 配置分析器
    analyser.fftSize = 128
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)
    
    // 使用模拟数据
    isInitialized.value = true
    updateSimulatedData()
  } catch (err) {
    console.error('初始化音频分析器失败:', err)
    // 使用模拟数据
    isInitialized.value = true
    updateSimulatedData()
  }
}

// 更新频率数据
const updateFrequencyData = () => {
  if (!isInitialized.value || !analyser) return
  
  animationFrameId = requestAnimationFrame(updateFrequencyData)
  
  analyser.getByteFrequencyData(dataArray)
  frequencyData.value = [...dataArray]
}

// 使用模拟数据（当无法获取真实音频数据时）
const updateSimulatedData = () => {
  animationFrameId = requestAnimationFrame(updateSimulatedData)
  
  // 创建模拟的音频频率数据
  const simulatedData = new Uint8Array(64)
  for (let i = 0; i < simulatedData.length; i++) {
    // 创建波浪效果
    const base = Math.sin(Date.now() * 0.002 + i * 0.2) * 50 + 50
    const variation = Math.sin(Date.now() * 0.005 + i * 0.1) * 30
    simulatedData[i] = Math.max(0, Math.min(255, base + variation))
  }
  
  frequencyData.value = simulatedData
}

// 监听语音状态变化
watch(
  () => speechStore.isSpeaking,
  (newValue) => {
    if (newValue && !isInitialized.value) {
      initAudioAnalyser()
    }
  }
)

// 组件挂载时初始化
onMounted(() => {
  if (speechStore.isSpeaking && !isInitialized.value) {
    initAudioAnalyser()
  }
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  if (audioContext) {
    audioContext.close()
  }
})

// 计算波形颜色
const getWaveColor = (index, value) => {
  // 根据频率和强度计算颜色
  const hue = (index / frequencyData.value.length * 180) + (Date.now() * 0.05) % 360
  const saturation = 80 + Math.min(20, value / 10)
  const lightness = 50 + Math.min(30, value / 10)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// 计算背景渐变
const backgroundGradient = computed(() => {
  const time = Date.now() * 0.001
  const hue1 = (time * 10) % 360
  const hue2 = (hue1 + 120) % 360
  
  return `linear-gradient(to right, 
    hsl(${hue1}, 80%, 30%) 0%, 
    hsl(${hue2}, 80%, 40%) 100%)`
})

// 获取波形高度
const getWaveHeight = (index) => {
  const value = frequencyData.value[index] || 0
  return (value / 255) * 40 // 最大高度40px
}
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" class="speech-indicator">
      <div class="speech-circle" :style="{ background: backgroundGradient }">
        <div class="wave-container">
          <!-- 横线波纹 -->
          <div class="wave-lines">
            <div 
              v-for="i in 32" 
              :key="i" 
              class="wave-line"
              :style="{
                height: `${getWaveHeight(i-1)}px`,
                backgroundColor: getWaveColor(i-1, frequencyData[i-1] || 0)
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.speech-indicator {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.speech-circle {
  width: 200px;
  height: 100px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 
              0 0 30px rgba(255, 255, 255, 0.2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.wave-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave-lines {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  height: 80%;
}

.wave-line {
  width: 3px;
  min-height: 2px;
  border-radius: 2px;
  transform-origin: bottom;
  transition: height 0.05s ease-out;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.8);
}
</style>