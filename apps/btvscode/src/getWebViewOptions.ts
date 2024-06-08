import { Uri } from "vscode"
import type { WebviewOptions } from "vscode"
import { join as joinPath } from "path"

export default function getWebviewOptions(extensionUri: Uri): WebviewOptions {
    let path = joinPath(extensionUri.path, "media")
    let mediaUri = extensionUri.with({ path: path })

    return {
        enableScripts: true,
        localResourceRoots: [mediaUri],
    }
}
