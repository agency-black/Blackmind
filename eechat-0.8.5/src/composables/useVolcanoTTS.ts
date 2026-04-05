import { ref } from 'vue'

interface VolcanoTTSOptions {
  appId: string
  token: string
  voiceType?: string
  speed?: number
  volume?: number
  pitch?: number
}

export function useVolcanoTTS(options?: Partial<VolcanoTTSOptions>) {
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const error = ref<Error | null>(null)
  
  // 默认配置
  const defaultOptions: VolcanoTTSOptions = {
    appId: localStorage.getItem('volcano_app_id') || '',
    token: localStorage.getItem('volcano_token') || '',
    voiceType: 'zh_female_wanwanxiaohe_moon_bigtts',
    speed: 1.0,
    volume: 1.0,
    pitch: 1.0
  }
  
  const config = { ...defaultOptions, ...options }
  
  let audioContext: AudioContext | null = null
  let audioSource: AudioBufferSourceNode | null | any = null
  
  // 初始化音频上下文
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext
  }
  
  // 使用HTTP API合成语音
  const synthesizeSpeech = async (text: string): Promise<ArrayBuffer> => {
    if (!config.appId || !config.token) {
      throw new Error('缺少火山引擎TTS配置，请检查环境变量')
    }
    
    // 构建请求参数
    const requestData = {
      "app": {
          "appid": config.appId,
          "token": config.token,
          "cluster": "volcano_tts",
      },
      "user": {
          "uid": "uid123"
      },
      "audio": {
          "voice_type": "zh_female_wanwanxiaohe_moon_bigtts",
          // "voice_type": "ICL_zh_female_xingganyujie_tob",
          "encoding": "mp3",
          "speed_ratio": 1,
      },
      "request": {
          "reqid": "uuid",
          "text": text,
          "operation": "query",
      }
    }
    
    try {
      // 发送HTTP请求
      const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${config.token}`
        },
        body: JSON.stringify(requestData)
          // body: JSON.stringify()
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`火山引擎TTS请求失败: ${response.status} ${errorText}`)
      }
      
      // 解析响应
      const responseData = await response.json()
      
      // 检查响应状态
      if (responseData.code !== 3000) {
        throw new Error(`火山引擎TTS错误: ${responseData.message || '未知错误'}`)
      }
      
      // 解码Base64音频数据
      const base64Audio = responseData.data
      const binaryString = atob(base64Audio)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      return bytes.buffer
    } catch (e) {
      console.error('TTS合成请求错误:', e)
      throw e
    }
  }
  
  // 播放音频
  const playAudio = async (audioBuffer: ArrayBuffer): Promise<void> => {
    try {
      const context = initAudioContext()
      
      // 停止当前播放
      if (audioSource) {
        audioSource.stop()
        audioSource.disconnect()
      }
      
      // 解码音频
      const decodedData = await context.decodeAudioData(audioBuffer)
      
      // 创建音频源
      audioSource = context.createBufferSource()
      audioSource.buffer = decodedData
      audioSource.connect(context.destination)
      
      // 监听播放结束
      audioSource.onended = () => {
        isPlaying.value = false
        audioSource = null
      }
      
      // 开始播放
      audioSource.start(0)
      isPlaying.value = true
      isPaused.value = false
      
      // 返回一个Promise，只有在音频播放完成或出错时才会解析
      return new Promise((resolve, reject) => {
        audioSource.onended = () => {
          isPlaying.value = false
          audioSource = null
          resolve();
        }
        
        // 添加错误处理
        audioSource.onerror = (err) => {
          isPlaying.value = false
          audioSource = null
          reject(err);
        }
      });
      
    } catch (e) {
      console.error('音频播放错误:', e)
      error.value = e instanceof Error ? e : new Error('音频播放错误')
      isPlaying.value = false
      throw error.value
    }
  }
  
  // 暂停播放
  const pause = () => {
    if (audioContext && isPlaying.value && !isPaused.value) {
      audioContext.suspend()
      isPaused.value = true
    }
  }
  
  // 恢复播放
  const resume = () => {
    if (audioContext && isPlaying.value && isPaused.value) {
      audioContext.resume()
      isPaused.value = false
    }
  }
  
  // 停止播放
  const stop = () => {
    if (audioSource) {
      try {
        audioSource.stop()
        audioSource.disconnect()
      } catch (e) {
        // 忽略已停止的错误
      }
      audioSource = null
    }
    
    isPlaying.value = false
    isPaused.value = false
  }
  
  // 使用火山引擎TTS合成并播放
  const speak = async (text: string) => {
    try {
      error.value = null
      
      // 获取音频数据
      const audioData = await synthesizeSpeech(text)
      
      // 播放音频并等待播放完成
      await playAudio(audioData)
      
      return true
    } catch (e) {
      console.error('TTS合成错误:', e)
      error.value = e instanceof Error ? e : new Error('TTS合成错误')
      isPlaying.value = false
      throw error.value
    }
  }
  
  // 清理资源
  const dispose = () => {
    stop()
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
  }
  
  return {
    speak,
    pause,
    resume,
    stop,
    dispose,
    isPlaying,
    isPaused,
    error
  }
}