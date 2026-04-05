<script setup lang="ts">
import { computed } from 'vue'

// 组件属性
const props = defineProps({
  // 文件类型（扩展名）
  fileType: {
    type: String,
    required: true
  },
  // 图标大小
  size: {
    type: [Number, String],
    default: 40
  }
})

// 文件类型映射配置
const fileTypeConfig = {
  // 文档类型
  pdf: { color: '#f15642', text: 'PDF' },
  doc: { color: '#2b579a', text: 'DOC' },
  docx: { color: '#2b579a', text: 'DOC' },
  txt: { color: '#8a8a8a', text: 'TXT' },
  md: { color: '#6c6c6c', text: 'MD' },
  
  // 表格类型
  xls: { color: '#217346', text: 'XLS' },
  xlsx: { color: '#217346', text: 'XLS' },
  csv: { color: '#1d6f42', text: 'CSV' },
  
  // 演示文稿
  ppt: { color: '#d24726', text: 'PPT' },
  pptx: { color: '#d24726', text: 'PPT' },
  
  // 图像类型
  jpg: { color: '#26a69a', text: 'JPG' },
  jpeg: { color: '#26a69a', text: 'JPG' },
  png: { color: '#90caf9', text: 'PNG' },
  gif: { color: '#7e57c2', text: 'GIF' },
  svg: { color: '#ff9800', text: 'SVG' },
  
  // 代码类型
  html: { color: '#e44d26', text: 'HTML' },
  css: { color: '#264de4', text: 'CSS' },
  js: { color: '#f7df1e', text: 'JS' },
  ts: { color: '#007acc', text: 'TS' },
  json: { color: '#5b5b5b', text: 'JSON' },
  
  // 压缩文件
  zip: { color: '#ffc107', text: 'ZIP' },
  rar: { color: '#8bc34a', text: 'RAR' },
  
  // 默认类型
  default: { color: '#069EFA', text: 'FILE' }
}

// 获取文件类型配置
const getFileTypeInfo = (type: string) => {
  // 移除前缀点并转为小写
  const cleanType = type.replace(/^\./, '').toLowerCase()
  return fileTypeConfig[cleanType] || fileTypeConfig.default
}

// 计算文件类型信息
const fileInfo = computed(() => getFileTypeInfo(props.fileType))

// 计算图标尺寸
const iconSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

// 计算文本大小
const textSize = computed(() => {
  const size = parseInt(String(props.size))
  return `${Math.max(size / 3, 140)}px`
})
</script>

<template>
  <div class="file-type-icon" :style="{ width: iconSize, height: iconSize }">
    <svg
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 文件主体 -->
      <path 
        :fill="fileInfo.color" 
        fill-opacity="0.7"
        d="M277.445 52L191 52C141.294 52 101 92.2944 101 142L101 247C101 263.569 114.431 277 131 277L388 277C404.569 277 418 263.569 418 247L418 190.822L277.445 52Z" 
      />
      
      <!-- 文件折角 -->
      <path 
        :fill="fileInfo.color" 
        fill-opacity="1"
        d="M418.481 192.7L418.481 192.625L277.901 52.4424L277.901 102.7C277.901 152.406 318.195 192.7 367.901 192.7L418.481 192.7Z" 
      />
      
      <!-- 文件类型文本 -->
      <text
        x="260"
        y="420"
        text-anchor="middle"
        :font-size="textSize"
        font-family="Arial, sans-serif"
        font-weight="bold"
        :fill="fileInfo.color" 
      >
        {{ fileInfo.text }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.file-type-icon {
  display: inline-block;
  position: relative;
}
</style>