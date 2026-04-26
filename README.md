# pot-app-translate-plugin-deepseek-next

一个基于 [Deepseek](https://platform.deepseek.com/) 的 [Pot](https://github.com/pot-app/pot-app) 外部翻译插件，由 [pot-app-translate-plugin-deepseek](https://github.com/Tzulao55/pot-app-translate-plugin-deepseek) 修改而来

## 功能特点

- 支持 `deepseek-v4-flash`、`deepseek-v4-pro` 模型
- 支持单独切换思考模式

## 使用前准备

- 安装 [Pot](https://github.com/pot-app/pot-app)
- 在 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 申请 API Key

## 插件安装

1. 下载 [Releases](https://github.com/Redns/pot-app-translate-plugin-deepseek-next/releases) 中以 `.potext` 结尾的安装包

2. 打开 Pot > 服务设置 > 添加外部插件 > 安装外部插件

3. 点击添加服务至翻译列表，配置模型、思考模式和 api key

   - deepseek-v4-pro 和 deepseek-v4-flash 的对比如下图所示，数据来源于 [deepseek](https://mp.weixin.qq.com/s/8bxXqS2R8Fx5-1TLDBiEDg)

     |       模型        | 参数 | 激活 | 预训练数据 | 上下文长度 | 输出长度  | **百万 tokens 输入<br />（缓存命中）** | **百万 tokens 输入<br />（缓存未命中）** | **百万 tokens 输出** |
     | :---------------: | :--: | :--: | :--------: | :--------: | :-------: | :------------------------------------: | :--------------------------------------: | :------------------: |
     | deepseek-v4-flash | 284B | 13B  |    32T     |     1M     | 最大 384K |               **0.2元**                |                 **1元**                  |       **2元**        |
     |  deepseek-v4-pro  | 1.6T | 49B  |    33T     |     1M     | 最大 384K |                **1元**                 |                 **3元**                  |       **6元**        |

   - [思考模式](https://api-docs.deepseek.com/zh-cn/guides/thinking_mode)：在输出最终回答之前，模型会先输出一段思维链内容，以提升最终答案的准确性

   - [api key](https://platform.deepseek.com/api_keys)

## 继续开发

安装包实际上是一个 **包含 main.js、info.json 和 *.svg 的 zip 压缩包**，可通过本地压缩工具压缩后修改后缀为 `.poxext`。本代码也提供 js 代码快速构建安装包

```bash
npm run build
```

执行后会在 `dist/` 目录生成 `plugin.com.krins.deepseek.next.potext`
