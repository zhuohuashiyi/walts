import * as vscode from 'vscode';
import axios from 'axios';


type KeyInfo = {apiKey?: string};
export type Settings = {pasteOnClick?: boolean, model?: string, maxTokens?: number, temperature?: number, enableTranslate?: boolean, vendor?: string, topP?: number, backEndAddress?: string};

export function activate(context: vscode.ExtensionContext) {
	
	// 创建页面视图，将其注册到vscode的上下文中
	const provider = new waltsViewProvider(context.extensionUri);
	
	// 获取用户设置
	const config = vscode.workspace.getConfiguration('walts');
	// 将用户设置的内容传递给页面视图
	provider.setAPIKey({
		apiKey: config.get('apiKey')
	});

	provider.setSettings({
		pasteOnClick: config.get('pasteOnClick') || false,
		maxTokens: config.get('maxTokens') || 500,
		temperature: config.get('temperature') || 0.5,
		model: config.get('model') || 'text-davinci-003',
        enableTranslate: config.get('enableTranslate') || false,
        vendor: config.get('vendor') || 'openai',
        topP: config.get('topP') || 0.5
	});

	// 注册页面视图
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(waltsViewProvider.viewType, provider,  {
			webviewOptions: { retainContextWhenHidden: true }
		})
	);


	const commandHandler = (command:string) => {
		provider.search('', command);
	};

	// 注册命令
	context.subscriptions.push(
		vscode.commands.registerCommand('walts.ask', () => 
			vscode.window.showInputBox({ prompt: 'Please ask me any question, and it is my pleasure to help you' })
			.then((value) => provider.search(value))
		),
		vscode.commands.registerCommand('walts.explain', () => commandHandler('code explain')),
		vscode.commands.registerCommand('walts.refactor', () => commandHandler('code refactor')),
		vscode.commands.registerCommand('walts.optimize', () => commandHandler('code optimize')),
		vscode.commands.registerCommand('walts.findProblems', () => commandHandler('code inspect')),
		vscode.commands.registerCommand('walts.documentation', () => commandHandler('code documentation'))
	);


	// 用户设置发生改变时保存新的用户设置
	vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
		if (event.affectsConfiguration('walts.apiKey')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setAPIKey({ apiKey: config.get('apiKey') });
		} else if (event.affectsConfiguration('walts.pasteOnClick')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ pasteOnClick: config.get('pasteOnClick') || false });
		} else if (event.affectsConfiguration('walts.maxTokens')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ maxTokens: config.get('maxTokens') || 500 });
		} else if (event.affectsConfiguration('walts.temperature')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ temperature: config.get('temperature') || 0.5 });
		} else if (event.affectsConfiguration('walts.model')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ model: config.get('model') || 'text-davinci-003' });
		} else if (event.affectsConfiguration('walts.enableTranslate')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ enableTranslate: config.get('enableTranslate') || false });
		} else if (event.affectsConfiguration('walts.vendor')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ vendor: config.get('vendor') || 'openai' });
		} else if (event.affectsConfiguration('walts.topP')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ topP: config.get('topP') || 0.5 });
		} else if (event.affectsConfiguration('walts.backEndAddress')) {
			const config = vscode.workspace.getConfiguration('walts');
			provider.setSettings({ backEndAddress: config.get('backEndAddress') || 'http://10.119.6.206:10024/api/search' });
		} 
	});
}





class waltsViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'walts.chatView';
	private _view?: vscode.WebviewView;

    private _historySessions?: string[] = []; 

	private _response?: string;
	private _prompt?: string;
	private _fullPrompt?: string;
	private _currentMessageNumber = 0;

	private _settings: Settings = {
		pasteOnClick: true,
		maxTokens: 500,
		temperature: 0.5,
        enableTranslate: false,
        vendor: "openai",
        topP: 0.5,
        backEndAddress: "http://10.119.6.206:10024/api/search",
        model: "text-davinci-003"
	};
	private _apiKey?: string;


	// 构造函数
	constructor(private readonly _extensionUri: vscode.Uri) {
        
	}

	// 设置APIKey
	public setAPIKey(apiKey: KeyInfo) {
		this._apiKey = apiKey.apiKey;
	}


	public setSettings(settings: Settings) {
		this._settings = {...this._settings, ...settings};
	}

	public getSettings() {
		return this._settings;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		// 设置选项，允许JS脚本
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		// 设置html页面视图
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// 添加一个时间监听器，当页面收到消息时触发
		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'codeSelected':
					{
						// 如果pasteOnClick设置被禁用不做任何事
						if (!this._settings.pasteOnClick) {
							break;
						}
						let code = data.value;
						//code = code.replace(/([^\\])(\$)([^{0-9])/g, "$1\\$$$3");
						const snippet = new vscode.SnippetString();
						snippet.appendText(code);
						// insert the code as a snippet into the active text editor
						vscode.window.activeTextEditor?.insertSnippet(snippet);
						break;
					}
				case 'prompt':
					{
						this.search(data.value, 'plain');
					}
			}
		});
  
	}


	public async resetSession() {
		this._prompt = '';
		this._response = '';
		this._fullPrompt = '';
		this._view?.webview.postMessage({ type: 'setPrompt', value: '' });
		this._view?.webview.postMessage({ type: 'addResponse', value: '' });
	}


	public async search(prompt?:string, promptType?:string) {
        const config = vscode.workspace.getConfiguration('walts');
		this._prompt = prompt;
		// focus gpt activity from activity bar
		if (!this._view) {
			await vscode.commands.executeCommand('walts.chatView.focus');
		} else {
			this._view?.show?.(true);
		}
		
		let response = '';
		this._response = '';
		// Get the selected text of the active editor
		const selection = vscode.window.activeTextEditor?.selection;
		const selectedText = vscode.window.activeTextEditor?.document.getText(selection);

		// 确保提示已显示
		this._view?.webview.postMessage({ type: 'setPrompt', value: this._prompt });
		this._view?.webview.postMessage({ type: 'addPrompt', value: '查询中...' });

        // 请求后端获取回复
        
		// Increment the message number
		this._currentMessageNumber++;

		try {
            const res = await axios.post(this._settings.backEndAddress || 'http://10.119.6.206:10024/api/search', {
                "prompt": prompt,
                "model": this._settings.model,
                "vendor": this._settings.vendor,
                "APIKey": this._apiKey,
                "promptType": promptType,
                "code": selectedText,
                "maxTokens": this._settings.maxTokens,
                "temprature": this._settings.temperature,
                "enableTranslate": this._settings.enableTranslate,
                "topP": this._settings.topP
            });	
            response = res.data;
			// close unclosed codeblocks
			// Use a regular expression to find all occurrences of the substring in the string
			const REGEX_CODEBLOCK = new RegExp('\`\`\`', 'g');
			const matches = response.match(REGEX_CODEBLOCK);
			// Return the number of occurrences of the substring in the response, check if even
			const count = matches ? matches.length : 0;
			if (count % 2 !== 0) {
				//  append ``` to the end to make the last code block complete
				response += '\n\`\`\`';
			}
			response += `\n\n---\n`;

		} catch (error:any) {
			let e = '';
			if (error.response) {
				console.log(error.response.status);
				console.log(error.response.data);
				e = `${error.response.status} ${error.response.data.message}`;
			} else {
				console.log(error.message);
				e = error.message;
			}
			response += `\n\n---\n[ERROR] ${e}`;
		}
		

		// Saves the response
		this._response = response;
        console.log(response);
		// Show the view and send a message to the webview with the response
		if (this._view) {
			this._view.show?.(true);
			// this._view.webview.postMessage({ type: 'addResponse', value: response });
			if(promptType==="plain"){
				this._view.webview.postMessage({ type: 'addResponse', value: response });
			}else{
				let str="";
				str=promptType+"\n"+"\`\`\`"+"\n"+selectedText+"\n"+"\`\`\`";
				this._view.webview.postMessage({ type: 'askResponse', instruct: str,value: response });
			}
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const microlightUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'scripts', 'microlight.min.js'));
		const tailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'scripts', 'showdown.min.js'));
		const showdownUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'scripts', 'tailwind.min.js'));
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<script src="${tailwindUri}"></script>
				<script src="${showdownUri}"></script>
				<script src="${microlightUri}"></script>
				<style>
				
				.code {
					white-space: pre;
				}
				p {
					padding-top: 0.4rem;
					padding-bottom: 0.4rem;
				}
				/* overrides vscodes style reset, displays as if inside web browser */
				ul, ol {
					list-style: initial !important;
					margin-left: 10px !important;
				}
				h1, h2, h3, h4, h5, h6 {
					font-weight: bold !important;
				}
				.input-box{
					// position:relative;
					height:10px !important;
					// margin-bottom:300px !important;
				}
				.input-style{
					border-radius:1000px !important;
					color:#fff !important;
					// position:fixed !important;
					// width:95% !important;
					
				}
				.hightlight{
					color:#2870EA;
				}
				.hightlight1{
					// color:#ff0000;
				}
				input:focus {
					outline: 2px solid #2870EA !important; 
			  	}
				.chatBox{
					margin-bottom: 20px;
				}
			  	.user {
					display: flex;
					margin-bottom: 30px;
				}

				.user_img {
					width: 30px;
					height: 30px;
					background: linear-gradient(-135deg, #0000cc, #009dff);
					border: 1px solid lightblue;
					border-radius: 50%;
					margin-right: 10px;
				}

				.walts {
					display: flex;
				}

				.img-box {
					height: 30px;
					width: 30px;
					border-radius: 50%;
					margin-right: 10px;
					display: inline-block;
  					vertical-align: middle;
				}

				.img-box img {
					width: 100%;
					height: 100%;
				}

				.flex-al {
					flex: 1;
				}
			  



				</style>
			</head>
			<body>
				<input class="input-style h-10 w-full text-white bg-stone-700 p-4 text-sm" placeholder="请输入要查询的信息!" id="prompt-input" />
				<div id="prompt" class="pt-4 text-sm">
				</div>
				<div id="response" class="pt-4 text-sm">
				</div>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}