// @ts-ignore 

const { json } = require("stream/consumers");

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  

  if (typeof (Storage) !== "undefined") {
    historyPrint();
  }

  let response = '';
  let historyResponse = '';
  let inputValue = "";
  let localMessage = [];
  let tempArray = [];


  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "addResponse": {
        let tempMessage = {
          type: 2,
          message: message.value
        };
        tempArray.push(tempMessage);
        localMessage.unshift(tempArray);
        localStorage.setItem('localMessage', JSON.stringify(localMessage));

        document.getElementById("prompt").innerHTML = "查询成功！";
        let str = "问题: " + inputValue + '\n';
        // response = fixCodeBlocks(message.value);
        // historyResponse = str + "回答：\n" + response + "\n" + historyResponse;
        // response = historyResponse;
        response = message.value;
        setResponse(inputValue);
        break;
      }
      case "clearResponse": {
        response = '';
        break;
      }
      case "setPrompt": {
        document.getElementById("prompt-input").value = message.value;
        break;
      }
      case "addPrompt": {
        document.getElementById("prompt").innerHTML = message.value;
        break;
      }
      case "askResponse": {
        tempArray = [];
        let tempMessage1 = {
          type: 1,
          message: message.instruct
        };
        tempArray.push(tempMessage1);
        let tempMessage2 = {
          type: 2,
          message: message.value
        };
        tempArray.push(tempMessage2);
        localMessage.unshift(tempArray);
        localStorage.setItem('localMessage', JSON.stringify(localMessage));

        document.getElementById("prompt").innerHTML = "查询成功！";
        // let str = "问题: " + message.instruct + '\n';
        response = fixCodeBlocks(message.value);
        // historyResponse = str + "回答：\n" + response + "\n" + historyResponse;
        // response = historyResponse;
        response = message.value;
        setResponse(message.instruct);
        break;
      }
    }
  });

  function fixCodeBlocks(response) {
    // Use a regular expression to find all occurrences of the substring in the string
    const REGEX_CODEBLOCK = new RegExp('\`\`\`', 'g');
    const matches = response.match(REGEX_CODEBLOCK);

    // Return the number of occurrences of the substring in the response, check if even
    const count = matches ? matches.length : 0;
    if (count % 2 === 0) {
      return response;
    } else {
      // else append ``` to the end to make the last code block complete
      return response.concat('\n\`\`\`');
    }
  }

  function setResponse(input) {
    var converter = new showdown.Converter({
      omitExtraWLInCodeBlocks: true,
      simplifiedAutoLink: true,
      excludeTrailingPunctuationFromURLs: true,
      literalMidWordUnderscores: true,
      simpleLineBreaks: true
    });
    response = fixCodeBlocks(response);
    html = converter.makeHtml(response);

    // document.getElementById("response").innerHTML = html;

    historyResponse = chatTemplate(input, html) + historyResponse ;
    document.getElementById("response").innerHTML = historyResponse;
    var preCodeBlocks = document.querySelectorAll("pre code");
    for (var i = 0; i < preCodeBlocks.length; i++) {
      preCodeBlocks[i].classList.add(
        "p-2",
        "my-2",
        "block",
        "overflow-x-scroll",
        "hightlight"
      );
    }

    var codeBlocks = document.querySelectorAll('code');
    for (var i = 0; i < codeBlocks.length; i++) {
      // Check if innertext starts with "Copy code"
      if (codeBlocks[i].innerText.startsWith("Copy code")) {
        codeBlocks[i].innerText = codeBlocks[i].innerText.replace("Copy code", "");
      }

      codeBlocks[i].classList.add("inline-flex", "max-w-full", "overflow-hidden", "rounded-sm", "cursor-pointer", "hightlight");

      codeBlocks[i].addEventListener('click', function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: 'codeSelected',
          value: this.innerText
        });
      });

      const d = document.createElement('div');
      d.innerHTML = codeBlocks[i].innerHTML;
      codeBlocks[i].innerHTML = null;
      codeBlocks[i].appendChild(d);
      d.classList.add("code");
    }

    microlight.reset('code');

    //document.getElementById("response").innerHTML = document.getElementById("response").innerHTML.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  // Listen for keyup events on the prompt input element
  document.getElementById('prompt-input').addEventListener('keyup', function (e) {
    // If the key that was pressed was the Enter key
    if (e.keyCode === 13) {
      if (!this.value.trim()) {
        document.getElementById("prompt").innerHTML = "请输入要查询的内容！";
        return;
      }
      inputValue = this.value;
      tempArray = [];
      let tempMessage = {
        type: 1,
        message: this.value
      };
      tempArray.push(tempMessage);

      vscode.postMessage({
        type: 'prompt',
        value: this.value
      });
    }
  });
})();

function chatTemplate(question = "暂无问题", answer = "暂无答案") {
  return `
  
      <div class="chatBox">
        <div class="user">
          <div class="user_img"></div>
          <div class="flex-al">${question}</div>
        </div>

        <div class="walts">
          <div class="img-box">
            <img src="../resources/icon.png" alt="">
          </div>
          <div class="flex-al">${answer}</div>
        </div>
      </div>
  
  `;
}

function historyPrint() {

  let html = '';
  let html1 = '';
  // localStorage.clear();
  try {

    document.getElementById("prompt").innerHTML = "1有缓存";
    localMessage = JSON.parse(localStorage.getItem('localMessage')) || [];
    document.getElementById("prompt").innerHTML = "2有缓存";
    if (localMessage.length > 0) {
      document.getElementById("prompt").innerHTML = "有缓存";
      var converter = new showdown.Converter({
        omitExtraWLInCodeBlocks: true,
        simplifiedAutoLink: true,
        excludeTrailingPunctuationFromURLs: true,
        literalMidWordUnderscores: true,
        simpleLineBreaks: true
      });
      document.getElementById("prompt").innerHTML = "有缓存3";
      localMessage.forEach((value, key) => {
        let str = '';
        let str1 = '';
        let temp = '';
        document.getElementById("prompt").innerHTML = "有缓存1"+ value;
          return;
        if (value) {
          
          value.forEach((item, itemkey) => {
            if (item.type === 1) {
              // str = "问题: " + item.message + '\n';
              str = fixCodeBlocks(item.message);
              html = converter.makeHtml(item.message);
            } else if (item.type === 2) {
              // str1 = "回答: \n" + item.message + '\n';
              str1 = fixCodeBlocks(item.message);
              html1 = converter.makeHtml(str1);
            }
            
          });
          temp = chatTemplate(html, html1);
          document.getElementById("prompt").innerHTML = "有缓存1"+temp;
        }
        historyResponse = historyResponse + "\n" + temp;
      });
      // historyResponse=str;
      // response = historyResponse;
      // setResponse();
      document.getElementById("prompt").innerHTML = "有缓存2";
    document.getElementById("response").innerHTML = historyResponse;
    var preCodeBlocks = document.querySelectorAll("pre code");
    for (var i = 0; i < preCodeBlocks.length; i++) {
      preCodeBlocks[i].classList.add(
        "p-2",
        "my-2",
        "block",
        "overflow-x-scroll",
        "hightlight"
      );
    }

    var codeBlocks = document.querySelectorAll('code');
    for (var i = 0; i < codeBlocks.length; i++) {
      // Check if innertext starts with "Copy code"
      if (codeBlocks[i].innerText.startsWith("Copy code")) {
        codeBlocks[i].innerText = codeBlocks[i].innerText.replace("Copy code", "");
      }

      codeBlocks[i].classList.add("inline-flex", "max-w-full", "overflow-hidden", "rounded-sm", "cursor-pointer", "hightlight");

      codeBlocks[i].addEventListener('click', function (e) {
        e.preventDefault();
        vscode.postMessage({
          type: 'codeSelected',
          value: this.innerText
        });
      });

      const d = document.createElement('div');
      d.innerHTML = codeBlocks[i].innerHTML;
      codeBlocks[i].innerHTML = null;
      codeBlocks[i].appendChild(d);
      d.classList.add("code");
    }

    microlight.reset('code');
    



    }


  } catch (error) {

  }
}

