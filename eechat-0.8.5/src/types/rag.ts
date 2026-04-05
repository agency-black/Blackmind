interface RagBase {
  title: string
  description?: string
  vector_collection?: string
  chunk_size: number
  chunk_overlap: number
  chunk_method: string
  embedding_model: string
  embedding_dimension: any
  embedding_model_type: string
  text_understanding_model: string
  image_understanding_model: string
  rerank_enabled: boolean
  rerank_model?: string
  is_default?: boolean
  embedding_apikey?: string
  embedding_baseurl?: string
  embedding_model_local?: string
}

export interface RagForm extends Omit<RagBase, 'id'> {}
export interface RagResponse extends RagBase {
  id: number | string;
  created_at?: string
  updated_at?: string
  document_count?: number
}

export interface RagState {
  bases: RagResponse[]
  loading: boolean
  loadingBases: boolean
  selectedBase: RagResponse | null
  error: string | null
  initialized: boolean
  showCreateDialog: boolean
  showEditDialog: boolean
  processingDocument: boolean
  serviceStatus: {
    running: boolean
    error: string | null
  },
  usingBases?: number[]
}

// 文档状态类型
export type DocumentStatus = 'pending' | 'indexing' | 'ready' | 'failed'

// 文档类型
export interface Document {
  id: number | string
  rag_base_id: number | string
  title: string
  description?: string
  file_path?: string
  file_size?: number
  file_type: string
  mime_type?: string
  source?: string
  status: DocumentStatus
  enabled: boolean
  chunk_count: number
  embedding_model?: string
  embedding_dimension?: number
  chunk_size?: number
  chunk_overlap?: number
  chunk_method?: string
  collection_name?: string
  error_message?: string
  metadata?: string
  processing_time?: number
  created_at: string
  updated_at: string
}

// 文档 Store 状态
export interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  loading: boolean
  uploading: boolean
  processing: boolean
  error: string | null
  totalCount: number
  page: number
  pageSize: number
}

export interface DocumentChunks {
  chunk_index: number
  id: number,
  content: string
}