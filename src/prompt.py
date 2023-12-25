import json

import openai
import zhipuai
import SparkApi
from flask import Flask, request
from websocket import create_connection

from util import translate


app = Flask(__name__)
with open('config/config-dev.json', encoding='utf-8') as f:
    config = json.load(f)
appConfig = config.get('app')
promptConfig = config.get('prompt')
chinesePromptConfig = config.get('chinesePrompt')
apiKeyConfig = config.get('apiKey')
sparkAIConfig = config.get('sparkAI')
youdaoConfig = config.get('youdao')
openai.api_key = apiKeyConfig['openai']
zhipuai.api_key = apiKeyConfig['zhipuai']


@app.route('/api/search', methods=['POST'])
def search():
    # 接口数据获取
    request_data = request.get_json()
    vendor = request_data.get('vendor', 'openai')
    model = request_data.get('model', 'text-davinci-003')
    api_key = request_data.get('APIKey')
    prompt_type = request_data.get('promptType', 'plain')
    prompt = request_data.get('prompt')
    code = request_data.get('code')
    max_tokens = request_data.get('maxTokens', 1024)
    temperature = request_data.get('temprature', 0.5)
    enable_translate = request_data.get('enableTranslate', False)
    top_p = request_data.get('topP', 0.5)
    # 数据有效性检查
    assert prompt_type in ['plain', 'code explain', 'code refactor', 'code optimize', 'code inspect', 'code documentation']
    if vendor == 'openai':
        return searchOpenAI(model, api_key, prompt_type, prompt, code, max_tokens, temperature, enable_translate, top_p)
    elif vendor == 'zhipuai':
        return searchZhiPuAI(model, api_key, prompt_type, prompt, code, max_tokens, temperature, top_p)
    elif vendor == 'sparkai':
        return searchSparkAI(prompt_type, prompt, code)
    
    
def searchOpenAI(model, api_key, prompt_type, prompt, code, max_tokens, temperature, enable_translate, top_p):
    if api_key:
        openai.api_key = api_key
    assert model in ['text-davinci-003', 'text-davinci-002', 'text-curie-001', 'gpt-3.5-turbo', 'code-davinci-002', 'code-cushman-002']
    if enable_translate and prompt_type == 'plain':
        prompt = translate(prompt, youdaoConfig)
    prompt = buildPrompt(prompt_type, prompt, code, True)
    response = openai.Completion.create(
        model=model,
        prompt=prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        top_p=top_p
    )
    openai.api_key = apiKeyConfig['openai']
    return response.choices[0].text


def searchZhiPuAI(model, api_key, prompt_type, prompt, code, max_tokens, temperature, top_p):
    model = "chatglm_turbo"
    if api_key:
        zhipuai.api_key = api_key
    prompt = buildPrompt(prompt_type, prompt, code, False)
    response = zhipuai.model_api.invoke(
        model=model,
        prompt=[{"role": "user", "content": prompt}],
        top_p=top_p,
        temperature=temperature,
        max_tokens=max_tokens
    )
    zhipuai.api_key = apiKeyConfig['zhipuai']
    return response['data']['choices'][0]['content']


def searchSparkAI(prompt_type, prompt, code):
    SparkApi.answer = ""
    prompt = buildPrompt(prompt_type, prompt, code, False)
    SparkApi.main(sparkAIConfig['appid'], sparkAIConfig['api_key'], sparkAIConfig['app_secret'], sparkAIConfig['url'], sparkAIConfig['domain'], [{"role": "user", "content": prompt}])
    return SparkApi.answer
    

def buildPrompt(prompt_type, prompt, code, english):
    if english:
        if prompt_type == 'code explain':
            prompt = promptConfig['codeExplainPrompt']
        elif prompt_type == 'code refactor':
            prompt = promptConfig['codeRefactorPrompt']
        elif prompt_type == 'code optimize':
            prompt = promptConfig['codeOptimizePrompt']
        elif prompt_type == 'code inspect':
            prompt = promptConfig['codeInspectPrompt']
        elif prompt_type == 'code documentation':
            prompt = promptConfig['codeDocumentationPrompt']
        if code:
            prompt = f"${prompt}\n\`\`\`\n${code}\n\`\`\`"
        prompt = promptConfig['promptTemplate'].format(prompt)
    else:
        if prompt_type == 'code explain':
            prompt = chinesePromptConfig['codeExplainPrompt']
        elif prompt_type == 'code refactor':
            prompt = chinesePromptConfig['codeRefactorPrompt']
        elif prompt_type == 'code optimize':
            prompt = chinesePromptConfig['codeOptimizePrompt']
        elif prompt_type == 'code inspect':
            prompt = chinesePromptConfig['codeInspectPrompt']
        elif prompt_type == 'code documentation':
            prompt = chinesePromptConfig['codeDocumentationPrompt']
        if code:
            prompt = f"${prompt}\n\`\`\`\n${code}\n\`\`\`"
        prompt = chinesePromptConfig['promptTemplate'].format(prompt)
    return prompt
    

if __name__ == '__main__':
    app.run(host=appConfig['host'], port=appConfig['port'])
    #app.run(host='10.119.6.207', port=1024)