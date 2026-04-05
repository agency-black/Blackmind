---
outline: deep
---

# eechat
以下文档演示硅基流动在 eechat 中的使用。

## 🧭 关于 eechat

::: tip
如何你觉得 [eechat](https://github.com/Lucassssss/eechat) 不错，欢迎给我们一个 Star ⭐️ 支持开源项目发展！
:::

eechat 是一款开源免费的国产 AI 应用，支持 Windows、macOS 和 Linux，集成了聊天、多模态指令执行（MCP）、知识库问答（RAG）、语音识别（ASR）、语音合成（TTS）等功能模块。
- **开箱即用**，无需代码基础，适合非技术背景用户。
- **免费开源**，国产的免费开源应用，数据都存储在本地
- **多模型支持**，同时支持 API 模型和本地模型聊天，可以自定义配置自己喜欢的模型
- **丰富的支持**，支持 MCP、RAG 和插件支持




## 🖥️ 下载 eechat

- **[官网下载](https://ee.chat)**  
- **[开源下载](https://github.com/Lucassssss/eechat/releases)**  


## 🖥️ 安装 eechat 并配置硅基流动模型

1. 以 Windows 为例，下载安装包，点击安装。

<!-- ![An image](/model/win-install-1.png) -->

2. 点击浏览，选择要安装的盘符，如 “D:”, 新建一个文件夹，如 “eechat”，点击确定并开始安装。

![An image](/model/win-install-2.png)  

3. 安装完成后，打开 eechat,按图示操作

![An image](/model/win-install-3.png) 

  1. 点击左侧菜单的最后一个图标“设置”
  2. 选中设置下的 “API模型”
  3. 在 API模型提供商中选择 "硅基流动(SiliconFlow/silicon)"
- 点击获取 API Key，打开硅基流动登录页面，如果已登录会进入硅基流动控制台页面

## 🔑 获取 API Key

1. 点击获取 API Key 后，会在浏览器打开硅基流动登录页面，登录您的账户信息

![An image](/model/win-install-4.png)  

2. 创建 API Key

![An image](/model/siliconflow-create-key.png)  

## ⚙️ 配置 API Key

3. 在 eechat 中配置提供商和Api key

![An image](/model/win-config-provider.png)

- 在 eechat 的 API 模型提供商中选择 "硅基流动(SiliconFlow/silicon)"
- 在 API Key 中粘贴刚刚创建的 API Key
- 在 API URL 中输入 ```https://api.siliconflow.cn/v1```
- 点击测试连接，如果测试成功就可以直接对话了，如果测试失败，请检查 API Key 或 API URL 是否正确。

::: tip
硅基流动的api接口默认是```https://api.siliconflow.cn/v1```，如有变动以 API 手册的为准。
:::

## ⚙️ 配置模型
1. 在 eechat 中点击模型列表

![An image](/model/add-model.png)

在弹出的浏览器窗口中选择模型，如图所示，选择要使用的模型，如 Qwen3，点击模型卡片，在右侧弹出的窗口中，点击复制模型 ID。其他模型同理，如硅基流动 deepseek, 找到对应的模型卡片并复制模型 ID 即可。

![An image](/model/siliconflow-copy-model.png)

2. 点击 eechat "新增模型" 按钮，在弹出的窗口中，粘贴刚刚复制的模型 ID，点击确定

![An image](/model/add-model-id.png)

这样模型就添加成功了。

## 💬 在聊天中使用模型

![An image](/model/select-model.png)

打开对话菜单，选择模型，开始聊天吧！

![An image](/model/talk.png)

## 🔗 相关参考
- 💻 [eechat 官网](https://ee.chat)
- 🧑‍💻 [eechat GitHub](https://github.com/Lucassssss/eechat)
- ☁️ [硅基流动控制台](https://console.siliconflow.cn)
- 📘 [硅基流动官方文档](https://docs.siliconflow.cn)