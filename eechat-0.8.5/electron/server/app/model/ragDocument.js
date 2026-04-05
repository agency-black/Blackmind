module.exports = app => {
  const { INTEGER, STRING, DATE, TEXT, BOOLEAN, FLOAT } = app.Sequelize

  const RagDocument = app.model.define(
    'rag_document',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '文档ID',
      },
      rag_base_id: {
        type: INTEGER,
        allowNull: false,
        comment: '所属知识库ID',
      },
      title: {
        type: STRING(255),
        allowNull: false,
        comment: '文档标题',
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: '文档描述',
      },
      file_path: {
        type: STRING(500),
        allowNull: true,
        comment: '文件路径',
      },
      file_size: {
        type: INTEGER,
        allowNull: true,
        comment: '文件大小(字节)',
      },
      file_type: {
        type: STRING(50),
        allowNull: false,
        comment: '文件类型(pdf/docx/txt等)',
      },
      mime_type: {
        type: STRING(100),
        allowNull: true,
        comment: 'MIME类型',
      },
      source: {
        type: STRING(255),
        allowNull: true,
        comment: '文档来源',
      },
      status: {
        type: STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        comment: '状态(pending/indexing/ready/failed)',
      },
      enabled: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用',
      },
      chunk_count: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '文本块数量',
      },
      embedding_model: {
        type: STRING(50),
        allowNull: true,
        comment: '使用的嵌入模型',
      },
      embedding_dimension: {
        type: INTEGER,
        allowNull: true,
        defaultValue: 1024,
        comment: '嵌入向量维度',
      },
      chunk_size: {
        type: INTEGER,
        allowNull: true,
        comment: '文本分块大小',
      },
      chunk_overlap: {
        type: INTEGER,
        allowNull: true,
        comment: '文本分块重叠大小',
      },
      chunk_method: {
        type: STRING(20),
        allowNull: true,
        comment: '分块方法',
      },
      collection_name: {
        type: STRING(100),
        allowNull: true,
        defaultValue: 'documents',
        comment: '向量集合名称',
      },
      error_message: {
        type: TEXT,
        allowNull: true,
        comment: '错误信息',
      },
      metadata: {
        type: TEXT,
        allowNull: true,
        comment: '元数据(JSON格式)',
      },
      processing_time: {
        type: FLOAT,
        allowNull: true,
        comment: '处理时间(秒)',
      },
      created_at: DATE,
      updated_at: DATE,
      deleted_at: DATE,
    },
    {
      tableName: 'rag_document',
      paranoid: true,
      timestamps: true,
      underscored: true,
    },
  )

   // 定义关联关系
   RagDocument.associate = function() {
    app.model.RagDocument.belongsTo(app.model.RagBase, {
      foreignKey: 'rag_base_id',
      as: 'ragBase'
    });
    
    app.model.RagDocument.hasMany(app.model.RagChunk, {
      foreignKey: 'document_id',
      as: 'chunks'
    });
  };

  return RagDocument
}
