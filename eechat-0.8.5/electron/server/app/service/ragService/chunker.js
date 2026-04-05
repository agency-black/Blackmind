const { Service } = require('egg')

class ChunkerService extends Service {
  /**
   * 将文本分割成块
   * @param {string} text 要分割的文本
   * @param {Object} options 分割选项
   * @returns {Array<string>} 文本块数组
   */
  async chunkText(text, options = {}) {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      method = 'sliding_window',
    } = options

    switch (method) {
      case 'paragraph':
        return this.chunkByParagraph(text, chunkSize, chunkOverlap)
      case 'sentence':
        return this.chunkBySentence(text, chunkSize, chunkOverlap)
      case 'sliding_window':
      default:
        return this.chunkBySlidingWindow(text, chunkSize, chunkOverlap)
    }
  }

  /**
   * 使用滑动窗口分块
   */
  chunkBySlidingWindow(text, chunkSize, chunkOverlap) {
    const chunks = []
    let startIndex = 0

    // 确保 chunkOverlap 不大于 chunkSize
    const overlap = Math.min(chunkOverlap, chunkSize - 1)

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length)
      chunks.push(text.substring(startIndex, endIndex))

      // 确保 startIndex 始终向前移动
      const stride = chunkSize - overlap
      startIndex += Math.max(1, stride) // 至少移动1个字符

      // 如果已经处理到文本末尾，直接退出
      if (endIndex >= text.length) break
    }

    return chunks
  }

  /**
   * 按段落分块
   */
  chunkByParagraph(text, chunkSize, chunkOverlap) {
    // TODO: 实现按段落分块
    // 先按段落分割，然后合并小段落直到达到目标大小
    const paragraphs = text.split(/\n\s*\n/)
    return this.mergeChunks(paragraphs, chunkSize, chunkOverlap)
  }

  /**
   * 按句子分块
   */
  chunkBySentence(text, chunkSize, chunkOverlap) {
    // TODO: 实现按句子分块
    // 先按句子分割，然后合并句子直到达到目标大小
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    return this.mergeChunks(sentences, chunkSize, chunkOverlap)
  }

  /**
   * 合并小块成大块
   */
  mergeChunks(items, chunkSize, chunkOverlap) {
    const chunks = []
    let currentChunk = ''

    for (const item of items) {
      // 如果当前块加上新项目超过了块大小，保存当前块并开始新块
      if (
        currentChunk.length + item.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk)
        // 保留一部分重叠内容
        const words = currentChunk.split(' ')
        const overlapWords = words.slice(
          Math.max(0, words.length - Math.floor(chunkOverlap / 5)),
        )
        currentChunk = overlapWords.join(' ')
      }

      currentChunk += (currentChunk ? ' ' : '') + item
    }

    // 添加最后一个块
    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    return chunks
  }
}

module.exports = ChunkerService
