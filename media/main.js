// @ts-ignore 

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();
  storageFlag=true;
  if (typeof(Storage) !== "undefined") {
    storageFlag=true;
  } else {
    storageFlag=false;
  }


  let response = '';
  let historyResponse = '';
  let inputValue="";
  let localMessage=[];
  let tempArray=[];
  // localStorage.clear();
  try {
    if(storageFlag){
      localMessage=JSON.parse(localStorage.getItem('localMessage'))||[];
      if(localMessage.length>0){
        let str='';
        localMessage.forEach((value,key) => {
          if(value){
            value.forEach((item,itemkey) => {
              if(item.type === 1){
                str+="问题: "+item.message+'\n';
              }else if(item.type === 2){
                str+="回答: \n"+item.message+'\n';
              }
    
            });
          }
        });
        historyResponse=str;
        response = str;
        setResponse();
      }
    }
    
  } catch (error) {
    
  }
  
 
  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "addResponse": {
        let tempMessage={
          type:2,
          message:message.value
        };
        tempArray.push(tempMessage);
        localMessage.unshift(tempArray);
        localStorage.setItem('localMessage', JSON.stringify(localMessage));
        
        document.getElementById("prompt").innerHTML = "查询成功！";
        let str="问题: "+inputValue+'\n';
        response = fixCodeBlocks(message.value);
        historyResponse =str+ "回答：\n"+response+"\n"+historyResponse;
        response=historyResponse;
        setResponse();
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
      case "addPrompt":{
        document.getElementById("prompt").innerHTML = message.value;
        break;
      }
      case "askResponse":{
        tempArray=[];
        let tempMessage1={
          type:1,
          message:message.instruct
        };
        tempArray.push(tempMessage1);
        let tempMessage2={
          type:2,
          message:message.value
        };
        tempArray.push(tempMessage2);
        localMessage.unshift(tempArray);
        localStorage.setItem('localMessage', JSON.stringify(localMessage));
        
        document.getElementById("prompt").innerHTML = "查询成功！";
        let str="问题: "+message.instruct+'\n';
        response = fixCodeBlocks(message.value);
        historyResponse =str+ "回答：\n"+response+"\n"+historyResponse;
        response=historyResponse;
        setResponse();
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

  function setResponse() {
        var converter = new showdown.Converter({
          omitExtraWLInCodeBlocks: true, 
          simplifiedAutoLink: true,
          excludeTrailingPunctuationFromURLs: true,
          literalMidWordUnderscores: true,
          simpleLineBreaks: true
        });
        response = fixCodeBlocks(response);
        html = converter.makeHtml(response);
        document.getElementById("response").innerHTML = html;

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

            codeBlocks[i].classList.add("inline-flex", "max-w-full", "overflow-hidden", "rounded-sm", "cursor-pointer");

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
      if(!this.value.trim()){
        document.getElementById("prompt").innerHTML = "请输入要查询的内容！";
        return;
      }
      inputValue=this.value;
      tempArray=[];
      let tempMessage={
        type:1,
        message:this.value
      };
      tempArray.push(tempMessage);
      
      vscode.postMessage({
        type: 'prompt',
        value: this.value
      });
    }
  });
})();


