import type { HookPlugin, ResponseHookFn } from "./hook.js"
import * as fs from "fs"
import * as path from "path"

const writeSingleFile: ResponseHookFn = async (_rawOutput, parsedOutput, workspace, options) => {
    let filePath: string | null = options?.filePath ?? null
    if (filePath) {
        // write the file
        if (filePath) {
            let fp = filePath
            if (!fp.startsWith(workspace)) {
                fp = path.join(workspace, fp)
            }
            let dirName = path.dirname(fp)
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true })
            }
            fs.writeFileSync(fp, parsedOutput)
        }
    }
    return true
}

const WriteSingleFile: HookPlugin = {
    name: "WriteSingleFilePlugin",
    funcs: [
        {
            type: "response",
            name: "WriteSingleFile",
            fn: writeSingleFile,
        },
    ],
}

export default WriteSingleFile
