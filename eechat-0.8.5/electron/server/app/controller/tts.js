const { Controller } = require('egg')

class TtsController extends Controller {
  /**
   * 获取可用的语音列表
   */
  async getVoices() {
    const { ctx } = this
    try {
      const voices = await ctx.service.tts.getVoices()
      ctx.body = ctx.helper.success(voices)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }

  /**
   * 文本转语音
   */
  async tts() {
    const { ctx } = this
    const { text, voice, format } = ctx.request.body
    
    if (!text) {
      ctx.body = ctx.helper.error('文本不能为空')
      return
    }
    
    try {
      const result = await ctx.service.tts.tts(text, voice, format)
      ctx.body = ctx.helper.success(result)
    } catch (error) {
      ctx.body = ctx.helper.error(error.message)
    }
  }
}

module.exports = TtsController
