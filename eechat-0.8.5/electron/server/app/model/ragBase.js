module.exports = app => {
  const { INTEGER, STRING, DATE, TEXT, BOOLEAN } = app.Sequelize

  const RagBase = app.model.define(
    'rag_base',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '知识库ID',
      },
      title: {
        type: STRING(100),
        allowNull: false,
        defaultValue: '新知识库',
        comment: '知识库标题',
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: '知识库描述',
      },
      uid: {
        type: STRING(50),
        allowNull: false,
        comment: '用户ID',
      },
      vector_collection: {
        type: STRING(100),
        allowNull: false,
        comment: 'LanceDB集合名称',
      },
      is_default: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否为默认知识库',
      },
      document_count: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '文档数量',
      },
      chunk_size: {
        type: INTEGER,
        allowNull: true,
        defaultValue: 1000,
        comment: '文本分块大小',
      },
      chunk_overlap: {
        type: INTEGER,
        allowNull: true,
        defaultValue: 200,
        comment: '文本分块重叠大小',
      },
      chunk_method: {
        type: STRING(20),
        allowNull: true,
        defaultValue: 'sliding_window',
        comment: '分块方法',
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
      embedding_model_type: {
        type: STRING(20),
        allowNull: true,
        defaultValue: 'api',
        comment: '模型类型(local/api)',
      },
      text_understanding_model: {
        type: STRING(50),
        allowNull: true,
        comment: '文本理解模型',
      },
      image_understanding_model: {
        type: STRING(50),
        allowNull: true,
        comment: '图像理解模型',
      },
      rerank_enabled: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用重排序',
      },
      rerank_model: {
        type: STRING(100),
        allowNull: true,
        comment: '重排序模型',
      },
      created_at: DATE,
      updated_at: DATE,
      deleted_at: DATE,
    },
    {
      tableName: 'rag_base',
      paranoid: true,
      timestamps: true,
      underscored: true,
    },
  )

  // 定义关联关系
  RagBase.associate = function() {
    app.model.RagBase.hasMany(app.model.RagDocument, {
      foreignKey: 'rag_base_id',
      as: 'documents'
    });
  };

  return RagBase
}
