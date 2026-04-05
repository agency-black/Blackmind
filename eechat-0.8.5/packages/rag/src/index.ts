import { Document } from '@langchain/core/documents'
import { Annotation, StateGraph } from '@langchain/langgraph'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { pull } from 'langchain/hub'
// import { llmDeepSeek } from './core/llm'
import { store, addDocuments } from './core/store'
import { webloader } from './core/loader/web'
import { splitter } from './core/splitter'
import { ChatDeepSeek } from '@langchain/deepseek'

const llmDeepSeek = new ChatDeepSeek({
  model: 'deepseek-chat',
  temperature: 0,
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export const run = async () => {
  const docs = await webloader('http://www.ee.chat')
  const chunks = await splitter(docs)
  const vectorStore = store('test')
  addDocuments('aa', chunks)

  const InputStateAnnotation = Annotation.Root({
    question: Annotation<string>,
  })

  const StateAnnotation = Annotation.Root({
    question: Annotation<string>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
  })

  const retrieve = async (state: typeof InputStateAnnotation.State) => {
    const retrievedDocs = await vectorStore.similaritySearch(state.question)
    return { context: retrievedDocs }
  }

  const generate = async (state: typeof StateAnnotation.State) => {
    const promptTemplate = await pull<ChatPromptTemplate>('rlm/rag-prompt')
    const docsContent = state.context.map(doc => doc.pageContent).join('\n')
    const messages = await promptTemplate.invoke({
      question: state.question,
      context: docsContent,
    })
    const response = await llmDeepSeek.invoke(messages)
    return { answer: response.content }
  }

  // Compile application and test
  const graph = new StateGraph(StateAnnotation)
    .addNode('retrieve', retrieve)
    .addNode('generate', generate)
    .addEdge('__start__', 'retrieve')
    .addEdge('retrieve', 'generate')
    .addEdge('generate', '__end__')
    .compile()

  let inputs = { question: '任务是如何分解的?' }

  const result = await graph.invoke(inputs)
  console.log(result.answer)
}

run()
