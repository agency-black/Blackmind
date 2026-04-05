const { Service } = require('egg')
const { EdgeTTS, VoiceList } = require('node-edge-tts')
const fs = require('fs')
const path = require('path')
const paths = require('../../config/paths')

module.exports = class TtsService extends Service {
  constructor(ctx) {
    super(ctx)
    this.tempDir = path.join(paths.tmpPath, 'tts')
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  /**
   * 获取可用的语音列表
   * @returns {Promise<Array>} 语音列表
   */
  async getVoices() {
    try {
      // 从 Bing API 获取语音列表
      const response = await this.ctx.curl(
        'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4',
        {
          dataType: 'json',
          timeout: 10000,
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`获取语音列表失败，状态码: ${response.status}`);
      }
      
      return response.data;
    } catch (error) {
      this.ctx.logger.error('获取语音列表失败:', error);
      
      // 如果 API 请求失败，尝试使用 node-edge-tts 作为备选方案
      try {
        const voices = await VoiceList.getVoices();
        return voices;
      } catch (fallbackError) {
        this.ctx.logger.error('备选方案获取语音列表也失败:', fallbackError);
        throw new Error('获取语音列表失败: ' + error.message);
      }
    }
  }

  /**
   * 文本转语音
   * @param {string} text 要转换的文本
   * @param {string} voice 语音名称，例如 zh-CN-XiaoxiaoNeural
   * @param {string} outputFormat 输出格式，默认为 audio-24khz-96kbitrate-mono-mp3
   * @returns {Promise<Object>} 包含音频base64数据的对象
   */
  async tts(text, voice = 'zh-CN-XiaoxiaoNeural', outputFormat = 'audio-24khz-96kbitrate-mono-mp3') {
    if (!text) {
      throw new Error('文本不能为空')
    }

    try {
      // 创建EdgeTTS实例
      const tts = new EdgeTTS({ 
        voice: voice, 
        lang: voice.split('-')[0] + '-' + voice.split('-')[1], 
        outputFormat: outputFormat, 
        // saveSubtitles: true, 
        // proxy: 'http://localhost:7890', 
        // pitch: '-10%', 
        // rate: '+10%', 
        // volume: '-50%', 
        // timeout: 10000 
      });
      
      // 生成唯一的临时文件名
      const fileName = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.mp3`
      const filePath = path.join(this.tempDir, fileName)
      
      // 过滤文本中的 markdown 代码块
      try {
        text = text.replace(/!\[.*?\]\(.*?\)|\[([^\]]+)\]\(.*?\)|[`*#_~\-]+|<[^>]+>|\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
      } catch (error) {
        
      }

      // 执行TTS并保存到临时文件
      await tts.ttsPromise(text, filePath)
      
      // 读取文件并转换为base64
      const audioBuffer = fs.readFileSync(filePath)
      const base64Audio = audioBuffer.toString('base64')
      
      // 获取MIME类型
      const mimeType = 'audio/mp3'
      
      // 删除临时文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      
      // 返回base64数据
      return {
        base64Audio,
        mimeType,
        format: 'mp3'
      }
    } catch (error) {
      this.ctx.logger.error('TTS转换失败:', error)
      throw new Error('TTS转换失败: ' + error.message)
    }
  }
}
