# -*- coding: utf-8 -*-
import sys
import uuid
import requests
import hashlib
import time
import json


def encrypt(signStr):
    hash_algorithm = hashlib.sha256()
    hash_algorithm.update(signStr.encode('utf-8'))
    return hash_algorithm.hexdigest()


def truncate(q):
    if q is None:
        return None
    size = len(q)
    return q if size <= 20 else q[0:10] + str(size) + q[size - 10:size]


def do_request(data, url):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    return requests.post(url, data=data, headers=headers)

        
def translate(text: str, youdaoConfig: dict) -> str:
    appid, app_secret, url = youdaoConfig['appid'], youdaoConfig['app_secret'], youdaoConfig['url']
    data = {}
    data['from'] = 'auto'
    data['to'] = 'en'
    data['signType'] = 'v3'
    curtime = str(int(time.time()))
    data['curtime'] = curtime
    salt = str(uuid.uuid1())
    signStr = appid + truncate(text) + salt + curtime + app_secret
    sign = encrypt(signStr)
    data['appKey'] = appid
    data['q'] = text
    data['salt'] = salt
    data['sign'] = sign
    response = do_request(data, url)
    res = response.content.decode('utf-8')
    res = json.loads(res)
    return res['translation'][0]



def getAccessToken(url, appKey, secretKey):
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    response = requests.request("POST", url.format(appKey, secretKey), headers=headers)
    return response.json().get("access_token")


if __name__ == '__main__':
    # print(translate('你好', {
    #     "appid": "2c35f8f88f85ee4c",
    #     "app_secret": "0FniYwQvIcgB7Zihe7SOwYxKHLkAPUIY",
    #     "url": "https://openapi.youdao.com/api"
    # }))
    print(getAccessToken("https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={}&client_secret={}", "GN7ND3YxBA6a3u0kqYCzlr3s", "xSbvPjHY5Aa7kUPNDyBtjYLcdyHlojoZ"))