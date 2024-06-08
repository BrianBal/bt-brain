import { Webview, WebviewPanel, Uri, Disposable, window, ViewColumn } from "vscode"
import getWebviewOptions from "./getWebViewOptions"
import { Session } from "core"
import { AiTask, AiTemplate, loadTemplates } from "core"
import { join } from "path"
import * as fs from "fs"
import * as crypto from "crypto"
import { tmpdir } from "os"

export default class TaskView {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: TaskView | undefined

    public static readonly viewType = "taskView"

    private readonly _panel: WebviewPanel
    private readonly _extensionUri: Uri
    private _disposables: Disposable[] = []
    private _workspace: string
    private _session: Session
    private _templates: AiTemplate[] = []
    private _selectedTemplate: AiTemplate | null = null
    private _task: AiTask | null = null
    private _confirmHook: Function

    public static createOrShow(extensionUri: Uri, workspace: string) {
        console.log("TaskView.createOrShow", workspace)
        const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined

        // If we already have a panel, show it.
        if (TaskView.currentPanel) {
            TaskView.currentPanel._panel.reveal(column)
            return
        }

        // Otherwise, create a new panel.
        const panel = window.createWebviewPanel(
            TaskView.viewType,
            "Bal Tools",
            column || ViewColumn.One,
            getWebviewOptions(extensionUri)
        )

        TaskView.currentPanel = new TaskView(panel, extensionUri, workspace)
    }

    public static revive(panel: WebviewPanel, extensionUri: Uri, workspace: string) {
        console.log("TaskView.revive", panel, workspace)
        // TaskView.currentPanel = new TaskView(panel, extensionUri, workspace)
    }

    private constructor(panel: WebviewPanel, extensionUri: Uri, workspace: string) {
        console.log("TaskView.constructor", workspace)
        this._panel = panel
        this._extensionUri = extensionUri
        this._workspace = workspace
        this._session = Session.get(workspace)
        this._confirmHook = () => {}
        this.beforeTemplate = this.beforeTemplate.bind(this)
        this.afterTemplate = this.afterTemplate.bind(this)
        this.humanReview = this.humanReview.bind(this)

        console.log("TaskView session", this._session)
        console.log("TaskView templates", this._templates)

        // Set the webview's initial html content
        this._update()

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

        // Update the content based on view changes
        // this._panel.onDidChangeViewState((e: any) => {
        //     console.log("TaskView.onDidChangeViewState", e)
        // })

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                console.log("TaskView.onDidReceiveMessage", message)
                switch (message.command) {
                    case "ready":
                        this.displayChooseTemplate()
                        break
                    case "selected-template":
                        this.handleSelectTemplate(message.data)
                        break
                    case "gathered-data":
                        this.handleTemplateDataGathered(message.data)
                        break
                    case "human-review-confirmed":
                        this._confirmHook(message.data)
                        break
                }
            },
            null,
            this._disposables
        )
    }

    sendMessage(cmd: string, data: any) {
        this._panel.webview.postMessage({ command: cmd, data: data })
    }

    public dispose() {
        TaskView.currentPanel = undefined

        // Clean up our resources
        this._panel.dispose()

        while (this._disposables.length) {
            const x = this._disposables.pop()
            if (x) {
                x.dispose()
            }
        }
    }

    private _update() {
        const webview = this._panel.webview
        this._updateWithName(webview)
    }

    private async _updateWithName(webview: Webview) {
        this._panel.title = "Bal Tools"
        this._panel.webview.html = await this._getBaseHTMLPage(webview)
    }

    private _getBaseHTMLPage(webview: Webview) {
        // Local path to main script run in the webview
        const scriptPath = join(this._extensionUri.path, "media", "main.js")
        const scriptPathOnDisk = this._extensionUri.with({ path: scriptPath })

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk)

        // Local path to css styles
        const resetPath = join(this._extensionUri.path, "media", "reset.css")
        const stylePath = join(this._extensionUri.path, "media", "vscode.css")
        const styleResetPath = this._extensionUri.with({ path: resetPath })
        const stylesPathMainPath = this._extensionUri.with({ path: stylePath })

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath)
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath)

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce()

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
                <meta charset="UTF-8">
                <meta 
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';"
                >
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
                <link href="${stylesMainUri}" rel="stylesheet">
                <title>Bal Tools</title>
			</head>
			<body>
                <div id="main">
                    <h1 id="lines-of-code-counter">Bal Tools</h1>
                    <div id="log">
                    </div>
                </div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
    }

    async displayChooseTemplate() {
        console.log("displayChooseTemplate")
        this._templates = await loadTemplates()
        console.log("displayChoosetemplate templates", this._templates)
        this.sendMessage("choose-template", this._templates ?? [])
        console.log("displayChooseTemplate", "choose-templates sent")
    }

    async handleSelectTemplate(templateId: string) {
        let template = this._templates!.find((t) => t.id === templateId)
        console.log("handleSelectTemplate", template)
        if (template) {
            this._selectedTemplate = template
            this.sendMessage("gather-data", template)
        }
    }

    async handleTemplateDataGathered(data: any) {
        console.log("handleTemplateDataGathered", data)
        this._task = new AiTask(this._workspace, this._selectedTemplate!, data)
        this._task.requestHumanReview = this.humanReview
        this._task.start(this.beforeTemplate, this.afterTemplate)
    }

    beforeTemplate(message?: string | null) {
        console.log("beforeTemplate", message)
        this.sendMessage("log", message)
    }
    afterTemplate(message?: string | null) {
        console.log("afterTemplate", message)
        this.sendMessage("log", message)
    }

    humanReview(text: string): Promise<string> {
        console.log("humanReview", text)
        return new Promise(async (resolve) => {
            this.sendMessage("confirm-review", text)
            let reviewedText = await this.confirmHumanReview()
            console.log("human review result", reviewedText)
            resolve(reviewedText)
        })
    }

    confirmHumanReview(): Promise<string> {
        console.log("confirmHumanReview start")
        console.log("confirmHumanReview waiting for hook ..")

        return new Promise((resolve) => {
            this._confirmHook = (data: any) => {
                console.log("confirmHumanReview hook", data)
                if (data.approved) {
                    resolve(data.text)
                } else {
                    this._panel.dispose()
                    resolve("")
                }
            }
        })
    }
}

function getNonce() {
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

function tmpFile(ext: string, content: any): string {
    let file = join(tmpdir(), "tmp." + crypto.randomBytes(16).toString("hex") + "." + ext)
    fs.writeFileSync(file, content)
    return file
}
