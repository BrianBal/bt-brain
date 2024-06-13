const { Session, AiTask, AiTemplate, loadTemplates, getValue, setValue } = require("core")
const vscode = require("vscode")
console.log("BRAIN ext runnign")

let panel = null
let session = null
let workspace = null
let task = null
let activeFile = null
let activeEditor = null
let activeSelectionText = null
let activeSelectionRange = null
let confirmHook = () => {}

function activate(context) {
    console.log("helper monkey active")

    // find current workspace
    if (vscode.workspace.workspaceFolders.length > 0) {
        workspace = vscode.workspace.workspaceFolders[0].uri.fsPath
        if (workspace) {
            session = Session.get(workspace)
        }
    }

    context.subscriptions.push(
        vscode.commands.registerCommand("brain.start", () => {
            vscode.window.showInformationMessage("BRAIN Starting")
            // find the the active file, and selection
            const editor = vscode.window.activeTextEditor
            if (editor) {
                activeEditor = editor
                activeFile = editor.document?.uri?.fsPath ?? null
                const selection = editor.selection
                if (selection && !selection.isEmpty) {
                    const selectionRange = new vscode.Range(
                        selection.start.line,
                        selection.start.character,
                        selection.end.line,
                        selection.end.character
                    )
                    activeSelectionText = editor.document.getText(selectionRange)
                    activeSelectionRange = selectionRange
                }
            }
            createWebView(context.extensionUri)
        })
    )

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer("BRAIN_VIEW", {
            async deserializeWebviewPanel(webviewPanel, state) {
                console.log(`deserializeWebviewPanel: ${state}`)
                vscode.window.showInformationMessage("BRAIN re-Starting")
                createWebView(context.extensionUri)
            },
        })
    }
}

function deactivate() {
    console.log("helper monkey deactivated")
}

async function createWebView(extUri) {
    panel = vscode.window.createWebviewPanel("BRAIN_VIEW", "BRAIN", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extUri, "static")],
    })

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        (message) => {
            console.log("webview.onDidReceiveMessage", message)
            switch (message.command) {
                case "kv-set":
                    console.log(
                        "webView kv-set calling setValue",
                        message.data.key,
                        message.data.value
                    )
                    setValue(message.data.key, message.data.value)
                    break
                case "kv-get":
                    getValue(message.data.key).then((value) => {
                        sendMessage("kv-get", { key: message.data.key, value: value })
                    })
                    break
                case "start-task":
                    startTask(message.data.template, message.data.data)
                    break
                case "human-review-confirmed":
                    console.log("human-review-confirmed", message.data)
                    confirmHook(message.data)
                    break
            }
        },
        null,
        this._disposables
    )

    updateWebView(panel.webview, extUri)
    let templates = await loadTemplates()
    sendMessage("models", {
        models: session.getModels(),
        defaultModel: session.getModel(),
    })
    sendMessage("templates", templates)
    sendMessage("vscode-active-file", activeFile)
    sendMessage("vscode-active-selection-text", activeSelectionText)
    sendMessage("vscode-active-selection-range", activeSelectionRange)
}

function beforeTemplate(msg) {
    sendMessage("log", msg)
}

function afterTemplate(msg) {
    sendMessage("log", msg)
}

function humanReview(text, title) {
    return new Promise((resolve) => {
        confirmHook = (data) => {
            if (data.approved) {
                resolve(data.text)
            } else {
                this._panel.dispose()
                task = null
            }
        }
        sendMessage("human-review", { text, title })
    })
}

function performExternalEdit(text) {
    console.log("performExternalEdit", text)
    // replace active selection with text
    if (activeEditor) {
        activeEditor.edit((edit) => {
            edit.replace(activeSelectionRange, text)
        })
    }
}

async function startTask(template, data) {
    data.vscode_active_file = activeFile
    data.vscode_active_text = activeSelectionText
    data.vscode_active_range = activeSelectionRange
    task = new AiTask(workspace, template, data)
    task.requestHumanReview = humanReview
    task.performExternalEdit = performExternalEdit
    task.start(beforeTemplate, afterTemplate)
}

function sendMessage(cmd, data) {
    panel.webview.postMessage({ command: cmd, data: data })
}

function updateWebView(webview, extUri) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(extUri, "static", "web.js")

    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk)

    // Local path to css styles
    const stylesPathMainPath = vscode.Uri.joinPath(extUri, "static", "brain.css")

    // Uri to load styles into webview
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath)

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce()

    webview.title = "BRAIN"
    webview.html = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
				<title>Cat Coding</title>
			</head>
			<body>
                <div id="main">Testing 123</div>
				<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
			</body>
			</html>`
}

function getNonce() {
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

module.exports = {
    activate,
    deactivate,
}
