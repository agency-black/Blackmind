-- v1.5 升级脚本

-- 如果没有列 name_zh， 添加列 name_zh
ALTER TABLE llm_config_provider ADD COLUMN name_zh TEXT;
ALTER TABLE llm_providers ADD COLUMN name_zh TEXT;


-- 更改硅基流动模型id名称
UPDATE llm_config_provider SET provider_id = 'siliconcloud' WHERE provider_id = 'silicon';
UPDATE llm_providers SET id = 'siliconcloud' WHERE id = 'silicon';

INSERT OR IGNORE INTO "llm_models" VALUES ('siliconcloud:Qwen/Qwen3-235B-A22B', 'siliconcloud', 'Qwen3-235B-A22B', 'Qwen', 1, 9, '2025-03-04T14:37:12.932Z', '2025-03-04T14:37:12.932Z', NULL);
INSERT OR IGNORE INTO "llm_models" VALUES ('siliconcloud:Pro/deepseek-ai/DeepSeek-V3', 'siliconcloud', 'Qwen3-235B-A22B', 'DeepSeek', 0, 9, '2025-03-04T14:37:12.932Z', '2025-03-04T14:37:12.932Z', NULL);
INSERT OR IGNORE INTO "llm_models" VALUES ('siliconcloud:deepseek-ai/DeepSeek-R1', 'siliconcloud', 'DeepSeek-R1', 'DeepSeek', 1, 9, '2025-03-04T14:37:12.932Z', '2025-03-04T14:37:12.932Z', NULL);
INSERT OR IGNORE INTO "llm_models" VALUES ('siliconcloud:Qwen/Qwen3-8B', 'siliconcloud', 'Qwen3-8B', 'Qwen', 0, 9, '2025-03-04T14:37:12.932Z', '2025-03-04T14:37:12.932Z', NULL);
INSERT OR IGNORE INTO "llm_models" VALUES ('siliconcloud:THUDM/GLM-Z1-32B-0414', 'siliconcloud', 'GLM-Z1-32B-0414', 'THUDM', 0, 9, '2025-03-04T14:37:12.932Z', '2025-03-04T14:37:12.932Z', NULL);
INSERT OR IGNORE INTO "llm_models" VALUES ('siliconcloud:Qwen/Qwen2.5-VL-72B-Instruct', 'siliconcloud', 'Qwen2.5-VL-72B-Instruct', 'Qwen', 0, 9, '2025-03-04T14:37:12.932Z', '2025-03-04T14:37:12.932Z', NULL);


UPDATE llm_config_provider SET name ='Silicon Cloud' WHERE provider_id ='siliconcloud';
UPDATE llm_providers SET name ='Silicon Cloud' WHERE id ='siliconcloud';

-- 添加中文模型名称
UPDATE llm_config_provider SET name_zh ='硅基流动' WHERE provider_id ='siliconcloud';
UPDATE llm_providers SET name_zh ='硅基流动' WHERE id ='siliconcloud';

UPDATE llm_config_provider SET name_zh ='深度求索' WHERE provider_id ='deepseek';
UPDATE llm_providers SET name_zh ='深度求索' WHERE id ='deepseek';

UPDATE llm_config_provider SET name_zh ='智谱AI' WHERE provider_id ='zhipu';
UPDATE llm_providers SET name_zh ='智谱AI' WHERE id ='zhipu';

UPDATE llm_config_provider SET name_zh ='腾讯混元' WHERE provider_id ='hunyuan';
UPDATE llm_providers SET name_zh ='腾讯混元' WHERE id ='hunyuan';

UPDATE llm_config_provider SET name_zh ='腾讯云TI' WHERE provider_id ='tencent-cloud-ti';
UPDATE llm_providers SET name_zh ='腾讯云TI' WHERE id ='tencent-cloud-ti';

UPDATE llm_config_provider SET name_zh ='百度AI' WHERE provider_id ='baidu-cloud';
UPDATE llm_providers SET name_zh ='百度AI' WHERE id ='baidu-cloud';

UPDATE llm_config_provider SET name_zh ='欧派云' WHERE provider_id ='ppio';
UPDATE llm_providers SET name_zh ='欧派云' WHERE id ='ppio';

UPDATE llm_config_provider SET name_zh ='零一万物' WHERE provider_id ='yi';
UPDATE llm_providers SET name_zh ='零一万物' WHERE id ='yi';

UPDATE llm_config_provider SET name_zh ='月之暗面' WHERE provider_id ='moonshot';
UPDATE llm_providers SET name_zh ='月之暗面' WHERE id ='moonshot';

UPDATE llm_config_provider SET name_zh ='英伟达' WHERE provider_id ='nvidia';
UPDATE llm_providers SET name_zh ='英伟达' WHERE id ='nvidia';

UPDATE llm_config_provider SET name_zh ='360智脑' WHERE provider_id ='zhinao';
UPDATE llm_providers SET name_zh ='360智脑' WHERE id ='zhinao';


UPDATE llm_providers SET sort = 0 WHERE id ='siliconcloud';
UPDATE llm_providers SET sort = 1 WHERE id ='deepseek';
UPDATE llm_providers SET sort = 2 WHERE id ='openai';
UPDATE llm_providers SET sort = 3 WHERE id ='anthropic';
UPDATE llm_providers SET sort = 4 WHERE id ='gemini';
UPDATE llm_providers SET sort = 4 WHERE id ='grok';
UPDATE llm_providers SET sort = 5 WHERE id ='doubao';
UPDATE llm_providers SET sort = 6 WHERE id ='baidu-cloud';
UPDATE llm_providers SET sort = 7 WHERE id ='tencent-cloud-ti';
UPDATE llm_providers SET sort = 8 WHERE id ='hunyuan';
UPDATE llm_providers SET sort = 9 WHERE id ='zhipu';
UPDATE llm_providers SET sort = 10 WHERE id ='yi';
UPDATE llm_providers SET sort = 10 WHERE id ='zhinao';

UPDATE llm_providers SET sort = 30 WHERE id ='openrouter';
UPDATE llm_providers SET sort = 30 WHERE id ='azure-openai';
UPDATE llm_providers SET sort = 30 WHERE id ='github';
UPDATE llm_providers SET sort = 30 WHERE id ='modelscope';
UPDATE llm_providers SET sort = 30 WHERE id ='fireworks';
UPDATE llm_providers SET sort = 30 WHERE id ='nvidia';
UPDATE llm_providers SET sort = 30 WHERE id ='moonshot';
UPDATE llm_providers SET sort = 30 WHERE id ='ppio';
UPDATE llm_providers SET sort = 30 WHERE id ='groq';
UPDATE llm_providers SET sort = 30 WHERE id ='mistral';

UPDATE llm_providers SET sort = 50 WHERE id ='together';
UPDATE llm_providers SET sort = 50 WHERE id ='minimax';
UPDATE llm_providers SET sort = 50 WHERE id ='ollama';
UPDATE llm_providers SET sort = 50 WHERE id ='lmstudio';
UPDATE llm_providers SET sort = 50 WHERE id ='hyperbolic';

UPDATE llm_providers SET sort = 100 WHERE id ='ocoolai';
UPDATE llm_providers SET sort = 100 WHERE id ='jina';
UPDATE llm_providers SET sort = 100 WHERE id ='aihubmix';
UPDATE llm_providers SET sort = 100 WHERE id ='dmxapi';
UPDATE llm_providers SET sort = 100 WHERE id ='perplexity';
UPDATE llm_providers SET sort = 100 WHERE id ='infini';
UPDATE llm_providers SET sort = 100 WHERE id ='baichuan';
UPDATE llm_providers SET sort = 100 WHERE id ='xirang';
UPDATE llm_providers SET sort = 100 WHERE id ='dashscope';
UPDATE llm_providers SET sort = 100 WHERE id ='stepfun';
UPDATE llm_providers SET sort = 100 WHERE id ='graphrag-kylin-mountain';

UPDATE llm_providers SET api_key_url = 'https://cloud.siliconflow.cn/i/d76rf65v' WHERE id ='siliconcloud';

PRAGMA user_version = 105;