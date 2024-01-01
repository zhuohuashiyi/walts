# Walts：一款高可用、支持多种大模型、功能丰富的强大的AI编程助手

### Overview

Walts(读音同Waltz, 这既是我们四个开发者名字首字母的缩写，也代表着我们祝愿所有使用本插件的开发者能够像华尔兹一样优雅编程)是一款高可用（前后端分离，后端部署在服务器上，提供稳定的服务）、支持多种大模型（openai系列、智谱ai的Chatglm、星火认知大模型等）、功能丰富（提供诸如代码解释、代码优化、代码检查等功能）的强大的AI编程助手。


### 需求分析

#### 功能性需求

- 用户可以通过对话框向大模型询问代码问题
- 用户可以选择一段代码，然后要求给出代码的解释
- 用户可以选择一段代码，然后要求优化这段代码
- 用户可以选择一段代码，然后要求检查这段代码中的潜在问题，并提供修改意见
- 用户可以选择一段代码，然后要求在不改变代码功能的前提下重构这段代码
- 用户可以选择一段代码，然后要求给出描述这段代码的文档
- 用户可以自主选择一些参数，如model, temprature, top_p等

#### 非功能性需求
- 系统应当提供稳定的服务，不能出现因为超时访问服务器而导致的服务不可以现象
- 由于使用本插件的未必母语是英语，所以系统应该考虑到这一点提供高质量的服务
- 系统的输出应当方便用户，比如说将代码部分显示出来

### UI Design

### 接口设计

本插件设计为前后端分离，其中前端用typescript、css、html、javascript等语言构建，主要负责呈现界面，后端用python实现，负责具体功能的实现，部署在服务器上（由于缺乏云服务器，且大模型的apiKey均为个人账号，部署在云上供任意人使用容易出现安全隐患，所以暂时部署在实验室的服务器上，校园网内的用户均可以正常访问，正常使用插件提供的高质量服务）。后端只提供一个接口，如下：
接口地址：`/api/search`
请求方式：`POST`
请求参数：
 - `vendor`: 服务提供商，如openai,zhipuai,sparkai等
 - `model`: 具体模型，各个服务提供商的可选模型是不同的，如openai可选模型有text-davinci-003、text-davinci-002等
 - `APIKey`: 对于所有服务提供商，都提供免费的公共apiKey, 但用户也可以传入自己的apiKey,系统保证只使用该key调用相应的大模型接口，不会存储滥用用户传入的APIKey
 - `promptType`: 提示的类型，可选有"plain"(表示用户简单的询问)， "code explain"(用户选择一段代码要求对其进行解释，该值不为plain时，prompt应为空)
 - `prompt`: 用户输入的提示，仅当`promptType`为plain时才有效
 - `code`: 用户选中的代码片段，仅当`promptType`不为plain时才有效
 - `maxTokens`、`temprature`、`topP`为调用大模型接口使用的参数
 - `enableTranslate`: boolean类型，仅当调用英文大模型时有效，如果为true,将用户的prompt翻译成英文
响应参数：response, 即位大模型输出的文本


### 功能实现细节

### 使用手册

#### 使用前提
从插件市场

### 团队分工

curl 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=GN7ND3YxBA6a3u0kqYCzlr3s&client_secret=xSbvPjHY5Aa7kUPNDyBtjYLcdyHlojoZ'