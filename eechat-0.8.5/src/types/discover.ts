// 定义发现页面的数据项类型
export interface DiscoverItem {
  id?: number | string
  key?: string
  title: string
  description?: string
  type: string
  tags?: string[]
  // 其他可能的字段
  [key: string]: any
}

// 定义分类选项类型
export type CategoryOption = "all" | string