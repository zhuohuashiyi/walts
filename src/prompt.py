import json
import logging


import openai
import zhipuai
import SparkApi
from flask import Flask, request
import requests

from util import translate, getAccessToken


app = Flask(__name__)
with open('config/config-dev.json', encoding='utf-8') as f:
    config = json.load(f)
appConfig = config.get('app')
promptConfig = config.get('prompt')
chinesePromptConfig = config.get('chinesePrompt')
apiKeyConfig = config.get('apiKey')
sparkAIConfig = config.get('sparkAI')
youdaoConfig = config.get('youdao')
baiduConfig = config.get('baidu')
openai.api_key = apiKeyConfig['openai']
zhipuai.api_key = apiKeyConfig['zhipuai']
baiduAccessToken = getAccessToken(baiduConfig['accessTokenUrl'], baiduConfig['apiKey'], baiduConfig['secretKey'])
logger = logging.getLogger('mylogger')
logger.setLevel(logging.DEBUG)

# 创建FileHandler对象
fh = logging.FileHandler('walts.log')
fh.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)

# 将FileHandler对象添加到Logger对象中
logger.addHandler(fh)


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
    logger.info("vendor: {}, model: {}, max_tokens: {}, temperature: {}, enable_translate: {}, top_p: {}".format(vendor, model, max_tokens, temperature, enable_translate, top_p))
    # 数据有效性检查
    assert prompt_type in ['plain', 'code explain', 'code refactor', 'code optimize', 'code inspect', 'code documentation', 'code test']
    res = ''
    if vendor == 'openai':
        res = searchOpenAI(model, api_key, prompt_type, prompt, code, max_tokens, temperature, enable_translate, top_p)
    elif vendor == 'zhipuai':
        res = searchZhiPuAI(model, api_key, prompt_type, prompt, code, max_tokens, temperature, top_p)
    elif vendor == 'sparkai':
        res = searchSparkAI(prompt_type, prompt, code)
    elif vendor == 'baidu':
        res = searchBaiduAI(model, prompt_type, prompt, code, temperature, top_p)
    elif vendor == 'google':
        res = searchGoogle(prompt_type, prompt, code, enable_translate)
    logger.info("answer: {}".format(res))
    return res
    
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


def searchBaiduAI(model, prompt_type, prompt, code, temperature, top_p):
    prompt = buildPrompt(prompt_type, prompt, code, False)    
    print(prompt)
    payload = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,
        "top_p": top_p
    })
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.request("POST", baiduConfig['url'].format(model, baiduAccessToken), headers=headers, data=payload)
    res = json.loads(response.text)
    return res['result']



def searchGoogle(prompt_type, prompt, code, enable_translate):
    if enable_translate and prompt_type == 'plain':
        prompt = translate(prompt, youdaoConfig)
    prompt = buildPrompt(prompt_type, prompt, code, True)
    data = {"contents": [{"parts": [{"text": prompt }]}]}
    headers = {
        'Content-Type': 'application/json'
    }
    response = requests.request('POST', config['googleUrl'].format(apiKeyConfig['google']), headers=headers, data=json.dumps(data))
    res = json.loads(response.content.decode('utf-8'))
    print(res)
    return res['candidates'][0]['content']['parts'][0]['text']
        

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
        elif prompt_type == 'code documentation':
            prompt = promptConfig['codeTestPrompt']
        if code:
            prompt = f"{prompt}\n\`\`\`\n{code}\n\`\`\`"
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
        elif prompt_type == 'code test':
            prompt = promptConfig['codeTestPrompt']
        if code:
            prompt = f"{prompt}\n\`\`\`\n{code}\n\`\`\`"
        prompt = chinesePromptConfig['promptTemplate'].format(prompt)
    return prompt
    

if __name__ == '__main__':
    app.run(host=appConfig['host'], port=appConfig['port'])