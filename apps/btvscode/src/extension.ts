import * as vscode from "vscode"
import getWebviewOptions from "./getWebViewOptions"
import TaskView from "./TaskView"

console.log("btvscode runnign")

export function activate(context: vscode.ExtensionContext) {
    console.log('btvscode, your extension "bal-tools" is now active!')

    context.subscriptions.push(
        vscode.commands.registerCommand("btvscode.helloWorld", () => {
            vscode.window.showInformationMessage("Hello World from Bal Tools!")
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand("btvscode.run", () => {
            // get the current workspace folder
            let workspaceFolder: string | undefined = undefined
            let folders = vscode.workspace.workspaceFolders ?? []
            console.log("btvscode, folders", folders)
            for (let folder of folders) {
                let path = folder.uri.fsPath
                console.log(" - path", path)
                workspaceFolder = path
                break
            }
            console.log("btvscode, btvscode.run", workspaceFolder)
            if (workspaceFolder) {
                TaskView.createOrShow(context.extensionUri, workspaceFolder!)
            } else {
                vscode.window.showInformationMessage("No workspace  World from Bal Tools!")
            }
        })
    )

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(TaskView.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`Got state: ${state}`)
                let workspaceFolder: string | undefined = undefined
                let folders = vscode.workspace.workspaceFolders ?? []
                console.log("btvscode, folders", folders)
                for (let folder of folders) {
                    let path = folder.uri.fsPath
                    console.log(" - path", path)
                    workspaceFolder = path
                    break
                }
                console.log("btvscode, registerWebviewPanelSerializer", workspaceFolder)
                if (workspaceFolder) {
                    webviewPanel.webview.options = getWebviewOptions(context.extensionUri)
                    TaskView.revive(webviewPanel, context.extensionUri, workspaceFolder!)
                } else {
                    vscode.window.showInformationMessage("No workspace  World from Bal Tools!")
                }
                // Reset the webview options so we use latest uri for `localResourceRoots`.
            },
        })
    }
}

export function deactivate() {}
