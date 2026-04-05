const { Service } = require('egg')
const fs = require('fs').promises
const path = require('path')
const pdf = require('pdf-parse')
const mammoth = require('mammoth')
// 添加新的依赖
const xlsx = require('xlsx')
const csv = require('csv-parser')
const marked = require('marked')
const { Readable } = require('stream')
const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)

class ExtractorService extends Service {
  /**
   * 根据文件类型提取文本
   * @param {Object} file 文件对象
   * @returns {Promise<string>} 提取的文本
   */
  async extractText(file) {
    const { file_path, mime_type } = file

    try {
      // 根据MIME类型或文件扩展名选择提取方法
      const extension = path.extname(file_path).toLowerCase()

      if (mime_type === 'application/pdf' || extension === '.pdf') {
        return await this.extractPdf(file_path)
      } else if (
        mime_type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === '.docx'
      ) {
        return await this.extractDocx(file_path)
      } else if (
        mime_type === 'application/msword' ||
        extension === '.doc'
      ) {
        return await this.extractDoc(file_path)
      } else if (mime_type === 'text/plain' || extension === '.txt') {
        return await this.extractTxt(file_path)
      } else if (
        mime_type === 'text/markdown' ||
        extension === '.md'
      ) {
        return await this.extractMarkdown(file_path)
      } else if (
        mime_type === 'text/csv' ||
        extension === '.csv'
      ) {
        return await this.extractCsv(file_path)
      } else if (
        mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        extension === '.xlsx'
      ) {
        return await this.extractExcel(file_path)
      } else if (
        mime_type === 'application/vnd.ms-excel' ||
        extension === '.xls'
      ) {
        return await this.extractExcel(file_path)
      } else if (
        mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        extension === '.pptx'
      ) {
        return await this.extractPowerPoint(file_path)
      } else if (
        mime_type === 'application/vnd.ms-powerpoint' ||
        extension === '.ppt'
      ) {
        return await this.extractPowerPoint(file_path)
      } else if (
        mime_type === 'text/html' ||
        extension === '.html' ||
        extension === '.htm'
      ) {
        return await this.extractHtml(file_path)
      } else if (
        mime_type === 'application/json' ||
        extension === '.json'
      ) {
        return await this.extractJson(file_path)
      } else {
        throw new Error(`不支持的文件类型: ${mime_type || extension}`)
      }
    } catch (error) {
      this.ctx.logger.error('文本提取失败:', error)
      throw error
    }
  }

  /**
   * 提取PDF文本
   */
  async extractPdf(file_path) {
    const dataBuffer = await fs.readFile(file_path)
    const data = await pdf(dataBuffer)
    return data.text
  }

  /**
   * 提取DOCX文本
   */
  async extractDocx(file_path) {
    const result = await mammoth.extractRawText({ path: file_path })
    return result.value
  }

  /**
   * 提取DOC文本
   * 注意：需要安装额外的转换工具或使用第三方服务
   */
  async extractDoc(file_path) {
    // 由于旧版Word文档格式复杂，可能需要使用外部工具
    // 这里使用mammoth尝试处理，但可能不完全支持
    try {
      const result = await mammoth.extractRawText({ path: file_path })
      return result.value
    } catch (error) {
      this.ctx.logger.error('DOC文件提取失败，可能需要转换为DOCX:', error)
      return `无法提取DOC文件内容: ${path.basename(file_path)}。建议转换为DOCX格式。`
    }
  }

  /**
   * 提取TXT文本
   */
  async extractTxt(file_path) {
    const content = await fs.readFile(file_path, 'utf8')
    return content
  }

  /**
   * 提取Markdown文本
   */
  async extractMarkdown(file_path) {
    const content = await fs.readFile(file_path, 'utf8')
    // 移除Markdown标记，只保留纯文本内容
    const textContent = marked.parse(content)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return textContent
  }

  /**
   * 提取CSV文本
   */
  async extractCsv(file_path) {
    const results = []
    const fileStream = fs.createReadStream(file_path)
    
    // 使用流处理CSV文件
    await new Promise((resolve, reject) => {
      fileStream
        .pipe(csv())
        .on('data', (data) => results.push(Object.values(data).join(' ')))
        .on('end', resolve)
        .on('error', reject)
    })
    
    return results.join('\n')
  }

  /**
   * 提取Excel文本
   */
  async extractExcel(file_path) {
    const workbook = xlsx.readFile(file_path)
    const result = []
    
    // 遍历所有工作表
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })
      
      // 添加工作表名称
      result.push(`工作表: ${sheetName}`)
      
      // 添加工作表数据
      sheetData.forEach(row => {
        if (row.length > 0) {
          result.push(row.join(' '))
        }
      })
      
      result.push('') // 添加空行分隔不同工作表
    })
    
    return result.join('\n')
  }

  /**
   * 提取PowerPoint文本
   * 注意：需要额外的库支持
   */
  async extractPowerPoint(file_path) {
    // PowerPoint提取需要特殊处理
    // 这里提供一个占位实现，实际应用中可能需要使用专门的PPT解析库
    this.ctx.logger.warn('PowerPoint提取功能需要额外支持，返回有限信息')
    return `PowerPoint文件: ${path.basename(file_path)}。请安装pptx库以获取完整支持。`
  }

  /**
   * 提取HTML文本
   */
  async extractHtml(file_path) {
    const content = await fs.readFile(file_path, 'utf8')
    // 简单实现，后续可以使用cheerio等库提取结构化内容
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * 提取JSON文本
   */
  async extractJson(file_path) {
    const content = await fs.readFile(file_path, 'utf8')
    try {
      // 解析JSON并格式化为可读文本
      const jsonData = JSON.parse(content)
      return JSON.stringify(jsonData, null, 2)
    } catch (error) {
      this.ctx.logger.error('JSON解析失败:', error)
      return content // 返回原始内容
    }
  }
}

module.exports = ExtractorService
