import { visit } from 'unist-util-visit'
import { h } from 'hastscript'
// import {h} from 'vue'
import { toString } from 'mdast-util-to-string'

export default function remarkPlugin() {
  return (tree: any) => {
    visit(tree, node => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name == 'tool_call') {
          const data = node.data || (node.data = {})
          const content = toString(node)

          // 提取工具信息，不使用 JSON.parse
          let toolInfo = { type: '', id: '', name: '', arguments: {} }
          let rawContent = content

          // 尝试提取基本信息
          const typeMatch = content.match(/"type"\s*:\s*"([^"]+)"/)
          const idMatch = content.match(/"id"\s*:\s*"([^"]+)"/)
          const nameMatch = content.match(/"name"\s*:\s*"([^"]+)"/)

          if (typeMatch) toolInfo.type = typeMatch[1]
          if (idMatch) toolInfo.id = idMatch[1]
          if (nameMatch) toolInfo.name = nameMatch[1]

          // 尝试安全解析完整 JSON，但不依赖它
          try {
            if (content.trim()) {
              const parsedInfo = JSON.parse(content)
              if (parsedInfo) {
                toolInfo = { ...toolInfo, ...parsedInfo }
              }
            }
          } catch (error) {
            // console.log('解析工具调用内容失败，使用正则提取的信息:', error)
          }

          // 显示名称处理
          const displayName = toolInfo.name
            ? toolInfo.name.replace(/^mcp_[^_]+_/, '')
            : '未知工具'

          data.hName = 'div'
          data.hProperties = {
            className:
              'tool-call-card my-2 border border-grey-900 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg overflow-hidden min-[500px]',
            'data-tool': toolInfo.name || '',
            'data-id': toolInfo.id || '',
          }
          data.hChildren = [
            // 工具信息头部
            h(
              'div',
              {
                class:
                  'flex space-x-4 items-center justify-between px-4 py-1 border-b border-blue-200 dark:border-blue-800',
              },
              [
                h('div', { class: 'flex items-center gap-1' }, [
                  h(
                    'span',
                    {
                      class:
                        'text-grey-600 dark:text-blue-400 font-mono text-sm font-bold',
                    },
                    '🛠️ ' + displayName,
                  ),
                  h(
                    'span',
                    { class: 'text-gray-400 dark:text-gray-200' },
                    '(' + (toolInfo.type || '工具调用') + ')',
                  ),
                ]),
                // 折叠按钮
                h(
                  'button',
                  {
                    class:
                      'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    onclick:
                      'this.parentElement.nextElementSibling.classList.toggle("hidden")',
                  },
                  '详情',
                ),
              ],
            ),
            // 可折叠的详细内容
            h('div', { class: 'hidden p-3 text-sm' }, [
              h(
                'div',
                {
                  class:
                    'bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto break-all whitespace-pre-wrap',
                },
                // 显示原始内容，确保内容始终可见
                rawContent,
              ),
            ]),
          ]
        }

        if (node.name == 'docs'){
          const data = node.data || (node.data = {})
          let content = toString(node)
          try {
            content = JSON.parse(content)
          } catch (error) {
            console.log('解析文档内容失败:', content)
          }
          
          data.hName = 'div'
          data.hProperties = {
            className:
              'docs-reference my-2 bg-white border border-zinc-200 dark:border-zinc-600 rounded-md overflow-hidden w-[500px] dark:bg-zinc-600 dark:text-zinc-200 dark:border-zinc-500',
          }
          
          // 创建文档列表标题
          const headerElement = h(
            'div',
            {
              class: 'flex items-center justify-between px-4 py-1 border-b',
            },
            [
              h('span', { class: 'flex items-center' }, [
                h('svg', {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  'stroke-width': "2",
                  'stroke-linecap': "round",
                  'stroke-linejoin': "round",
                  class: "lucide lucide-book-open-icon mr-1"
                }, [
                  h('path', { d: "M12 7v14" }),
                  h('path', { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" })
                ]),
                '引用文档'
              ]),
              // 折叠按钮
              h(
                'button',
                {
                  class: '',
                  onclick: 'this.parentElement.nextElementSibling.classList.toggle("hidden")',
                },
                '收起',
              ),
            ]
          )
          
          // 创建文档列表内容 - 默认不隐藏
          const listItems = Array.isArray(content) 
            ? content.map(doc => 
                h('div', { 
                  class: 'flex items-center py-1 px-4 border-b last:border-0',
                  'data-doc-id': doc.id || '',
                }, [
                  h('span', { class: 'mr-2' }, '📄'),
                  h('span', { class: 'flex-1' }, doc.title || '未命名文档'),
                  h('span', { class: 'text-xs' }, `ID: ${doc.id || 'unknown'}`)
                ])
              )
            : [h('div', { class: 'p-3 text-sm' }, '无可用文档')]
          
          // 移除 hidden 类，使其默认展开
          const listElement = h('div', { class: '' }, listItems)
          
          data.hChildren = [headerElement, listElement]
        }
      }
    })
  }
}
