# setup
import google.generativeai as genai
 
genai.configure(api_key='AIzaSyBdHCekBwLzWixqtRNjsnuBfmwrzfm-mzo')  # 填入自己的api_key
 
# # 查询模型
# for m in genai.list_models():
#     print(m.name)
#     print(m.supported_generation_methods)
model = genai.GenerativeModel('gemini-pro')
response = model.generate_content("告诉我太阳系中最大行星的相关知识")
print(response.text)

curl   -H 'Content-Type: application/json'   -d '{"contents":[{"parts":[{"text":"Write a story about a magic backpack"}]}]}'  -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyBdHCekBwLzWixqtRNjsnuBfmwrzfm-mzo