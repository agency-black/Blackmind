module.exports = app => {
  const { INTEGER, STRING, DATE, TEXT, FLOAT } = app.Sequelize

  const RagChunk = app.model.define(
    'rag_chunk',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '块ID',
      },
      document_id: {
        type: INTEGER,
        allowNull: false,
        comment: '所属文档ID',
      },
      rag_base_id: {
        type: INTEGER,
        allowNull: false,
        comment: '所属知识库ID',
      },
      chunk_index: {
        type: INTEGER,
        allowNull: false,
        comment: '块索引',
      },
      content: {
        type: TEXT,
        allowNull: false,
        comment: '块内容',
      },
      vector_id: {
        type: STRING(100),
        allowNull: true,
        comment: 'LanceDB中的向量ID',
      },
      embedding_model: {
        type: STRING(50),
        allowNull: true,
        defaultValue: 'nomic-embed-text',
        comment: '使用的嵌入模型',
      },
      embedding_dimension: {
        type: INTEGER,
        allowNull: true,
        defaultValue: 1024,
        comment: '嵌入向量维度',
      },
      collection_name: {
        type: STRING(100),
        allowNull: true,
        defaultValue: 'documents',
        comment: '向量集合名称',
      },
      similarity_score: {
        type: FLOAT,
        allowNull: true,
        comment: '最近一次查询的相似度分数',
      },
      rerank_score: {
        type: FLOAT,
        allowNull: true,
        comment: '重排序分数',
      },
      metadata: {
        type: TEXT,
        allowNull: true,
        comment: '元数据(JSON格式)',
      },
      created_at: {
        type: DATE,
        allowNull: false,
      },
      updated_at: {
        type: DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'rag_chunk',
      paranoid: true,
      timestamps: true,
      underscored: true,
    },
  )

  // 定义关联关系
  RagChunk.associate = function() {
    app.model.RagChunk.belongsTo(app.model.RagDocument, {
      foreignKey: 'document_id',
      as: 'document'
    });
    app.model.RagChunk.belongsTo(app.model.RagBase, {
      foreignKey: 'rag_base_id',
      as: 'ragBase'
    });
  };

  return RagChunk
}
