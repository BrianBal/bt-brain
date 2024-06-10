import type { FileItem, HookPlugin, InputHookFn } from "./hook.js"
import { readFile, stat } from "fs/promises"
import * as path from "path"

const inputReadFile: InputHookFn = async (filePath, options = {}) => {
    let contents = ""
    let encoding = options?.endcoding ?? "utf8"
    let workspace = options.workspace ?? ""
    // console.log("inputReadFile filePath", filePath)
    // console.log("inputReadFile workspace", workspace)

    let fp = filePath
    if (!fp.startsWith(workspace)) {
        fp = path.join(workspace, filePath)
    }
    fp = path.resolve(fp)

    if (fp) {
        try {
            let fileStat = await stat(fp)
            if (fileStat?.isFile()) {
                let buffer = await readFile(fp, encoding)
                contents = buffer.toString()
            }
        } catch (e) {
            contents = ""
        }
    }
    return contents
}

const inputReadFiles: InputHookFn = async (files: any, options = {}) => {
    let fileContents: FileItem[] = []
    if (files && Array.isArray(files)) {
        for (let f of files) {
            let content = await inputReadFile(f, options)
            fileContents.push({ file: f, content: content })
        }
    }
    return fileContents
}

const ReadFiles: HookPlugin = {
    name: "ReadFilesPlugin",
    funcs: [
        {
            type: "input",
            name: "ReadFile",
            fn: inputReadFile,
        },
        {
            type: "input",
            name: "ReadFiles",
            fn: inputReadFiles,
        },
    ],
}

export default ReadFiles
