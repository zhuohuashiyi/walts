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
- 用户可以选择一段代码，然后要求给出描述这段代码的单元测试
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

提示模板："现在你是一个聪明的、乐于助人的、专业的开发人员。作为帮助用户编程的助手，你总是用中文给出正确的答案，并且只按照指示做。你总是如实回答，从来不胡编乱造。在响应下面的提示时，请确保使用Github风格的Markdown正确地设置您的响应样式。\n使用markdown语法来标记标题、列表、彩色文本、代码块、高亮等。确保在你的实际回复中不要提到markdown或stying。尽可能在一个代码块中编写代码)\n{}"
也就是说：每次给大模型的输入都不是用户的原始问题，而是将用户的原始问题嵌入到了以上的提示模板中。而这提示模板主要有以下几个要点：
- 指明应用领域是编程
- 强调要如实回答，不能胡编乱造
- 要求回答中的代码要以markdown风格的形式呈现，即用``` ```包裹。这方便了后续对于代码块的提取
而如果用户选中了代码块的话，也会以```{code}```添加在提示的末尾。
对于代码解释、代码重构、代码优化等功能的实现也是基于预先设定的提示（指令），这些相当于用户提出的问题。如下：
- 代码解释： 解释这段代码做了什么事情
- 代码重构：重构以上的代码然后说说你干了些什么
- 代码优化：优化接下来的这段代码，如果没有可以优化点就说没有优化点
- 代码检查：从接下来的这段代码中找出一些问题，修复他们并且解释一下这些问题（不要改变其他无关的事情，如果代码没有问题就说没有问题
- 代码文档：为接下来的这段代码写一个文档
- 代码测试：为接下来的这段代码编写单元测试


用户可以设置的参数：
- model: 具体模型
- maxTokens: 每次对话问题加回复的最大词数，注意如果设置较小，回复会被截断，超出最大次数限制的部分会被舍去
- temperature: 在0到1之间，值越大，则表示生成的文本更具有创造力，即一样的问题回复不一样
- top_p: 控制生成文本的概率分布，更小的值带来更加专注和一致的输出
- backEndAddress: 后端地址，我们将其部署在了实验室的服务器上10.119.6.206，凡是校园网内的用户即可访问


### 使用手册

在插件市场搜索walts,点击安装。首先用户可以在settings界面，搜索walts来到walts的配置界面，可以对vendor,model等进行配置。在walts插件界面，可以在输入框中输入任何想要查询的代码问题。选中一段代码，右键可以选择诸多代码功能。点击walts给出的回复代码块中，可以将代码复制到光标处。


### 演示案例

#### 代码生成
model: gemini_pro, 

#### 代码优化
```c++
long Test1() {
    long sum = 0;
    for (int i = 0; i < 1000000; i++) {
        int j = 10;
        sum += j * i;
    }
    return sum;
}
```
void Test1(int arr[], int length) {
    int smallestIndex = 0;
    for (int i = 1; i < length; i++) {
        if (arr[i] < arr[smallestIndex]) {
            smallestIndex = i;
        }
    }
    int temp = arr[smallestIndex];long Test1() {
        long sum = 0;
        for (int i = 0; i < 1000000; i++) {
            int j = 10;
            sum += j * i;
        }
        return sum;
    }
    arr[smallestIndex] = arr[0];
    arr[0] = temp;
}
```c++

```
```C++
string Test1() {
    std::string str = "";
    for (int i = 0; i < 10000; i++) {
        str += char(i % 26 + 65);
    }
    return str;
}
```
```golang
func pushDominoes(dominoes string) string {
    n := len(dominoes)
    right := make([]int, n)
    t := n
    for i := n - 1; i >= 0; i-- {
        ch := dominoes[i]
        right[i] = t
        if t != n {
            t++
        }
        if ch == 'L' {
            t = 1
        } else if ch == 'R' {
            t = n
        }
    }
    t = n
    var ans string = ""
    for i := 0; i < n; i++ {
        ch := dominoes[i]
        if ch == '.' {
            if t < right[i] {
                ch = 'R'
            } else if t > right[i] {
                ch = 'L'
            }
        } 
        ans += string(ch)  
        ch = dominoes[i]
        if t != n {
            t++
        }
        if ch == 'R' {
            t = 1
        } else if ch == 'L' {
            t = n
        }
    }
    return ans
}
```

#### 代码检查
```python
def login(username, password):
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='123456', db='users')
    cursor = conn.cursor()
    sql = "SELECT * FROM user WHERE username='%s' AND password='%s'" % (username, password)
    cursor.execute(sql)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result
```

```c++
int vul2(char *arg, char *buf) {
    strcpy(buf, arg);
    return 0;
}

int vul1(char *argv[]) {
    char buf[768];
    vul2(argv[1], buf);
}
```


#### 代码重构
```c++
# coding=utf-8
def heap_sort(array):
    first = len(array) // 2 - 1
    for start in range(first, -1, -1):
        # 从下到上，从右到左对每个非叶节点进行调整，循环构建成大顶堆
        big_heap(array, start, len(array) - 1)
    for end in range(len(array) - 1, 0, -1):
        # 交换堆顶和堆尾的数据
        array[0], array[end] = array[end], array[0]
        # 重新调整完全二叉树，构造成大顶堆
        big_heap(array, 0, end - 1)
    return array


def big_heap(array, start, end):
    root = start
    # 左孩子的索引
    child = root * 2 + 1
    while child <= end:
        # 节点有右子节点，并且右子节点的值大于左子节点，则将child变为右子节点的索引
        if child + 1 <= end and array[child] < array[child + 1]:
            child += 1
        if array[root] < array[child]:
            # 交换节点与子节点中较大者的值
            array[root], array[child] = array[child], array[root]
            # 交换值后，如果存在孙节点，则将root设置为子节点，继续与孙节点进行比较
            root = child
            child = root * 2 + 1
        else:
            break

if __name__ == '__main__':
    array = [10, 17, 50, 7, 30, 24, 27, 45, 15, 5, 36, 21]
    print(heap_sort(array))
class Solution {
public:
    bool isNumber(string s) {
        int n = s.size();
        if (n == 0) return false;
        if (s[0] == 'e' || s[0] == 'E') return false;
        int pos = -1;
            for (int i = 1; i < n; i++) {
                if (s[i] == 'e' || s[i] == 'E') {
                    pos = i;
                    break;
                }
            }
        if (pos != -1) {
            if (isInt(s.substr(0, pos)) || isFloat(s.substr(0, pos))) {
                if (isInt(s.substr(pos + 1, n - pos))) return true;
            }
            return false;
        }
        if (isFloat(s) || isInt(s)) return true;
        return false;
    }
    bool isInt(string s) {
        if (s[0] == '+' || s[0] == '-') {
            if (s.size() == 1) return false;
        }
        if (s[0] == '.') return false;
        if (s[0] >= 'a' && s[0] <= 'z') return false;
        if (s[0] >= 'A' && s[0] <= 'Z') return false;
        for (int i = 1; i < s.size(); i++) {
            if (s[i] >= '0' && s[i] <= '9') continue;
            return false;
        }
        return s.size() != 0;
    }
    bool isFloat(string s) {
        
        int num = 0, n1 = 0;
        if (s[0] >= 'a' && s[0] <= 'z') return false;
        if (s[0] >= 'A' && s[0] <= 'Z') return false;
        if (s[0] == '.') num++;
        if (s[0] >= '0' && s[0] <= '9') n1++;
        for (int i = 1; i < s.size(); i++) {
            if (s[i] >= '0' && s[i] <= '9') {
                n1++;
                continue;
            } else if (s[i] == '.') {
                num++;
            } else {
                return false;
            }
        }
        return (s.size() != 0) && num == 1 && n1 != 0;
    }
   
};
```

#### 其他
```python
def quick_sort(array: List[int]) -> List[int]:
    if len(array) < 2:
        return array

    pivot = array[len(array) // 2]

    left = [x for x in array if x < pivot]
    middle = [x for x in array if x == pivot]
    right = [x for x in array if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)
```

```python
# coding=utf-8
def heap_sort(array):
    first = len(array) // 2 - 1
    for start in range(first, -1, -1):
        # 从下到上，从右到左对每个非叶节点进行调整，循环构建成大顶堆
        big_heap(array, start, len(array) - 1)
    for end in range(len(array) - 1, 0, -1):
        # 交换堆顶和堆尾的数据
        array[0], array[end] = array[end], array[0]
        # 重新调整完全二叉树，构造成大顶堆
        big_heap(array, 0, end - 1)
    return array
 
 
def big_heap(array, start, end):
    root = start
    # 左孩子的索引
    child = root * 2 + 1
    while child <= end:
        # 节点有右子节点，并且右子节点的值大于左子节点，则将child变为右子节点的索引
        if child + 1 <= end and array[child] < array[child + 1]:
            child += 1
        if array[root] < array[child]:
            # 交换节点与子节点中较大者的值
            array[root], array[child] = array[child], array[root]
            # 交换值后，如果存在孙节点，则将root设置为子节点，继续与孙节点进行比较
            root = child
            child = root * 2 + 1
        else:
            break

if __name__ == '__main__':
    array = [10, 17, 50, 7, 30, 24, 27, 45, 15, 5, 36, 21]
    print(heap_sort(array))

```

### 团队分工