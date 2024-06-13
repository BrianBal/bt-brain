import type { HookPlugin, ResponseHookFn, FileItem } from "./hook.js"
import * as fs from "fs"
import * as path from "path"
import { createEmbedForFile } from "./createEmbeds.js"

const writeSingleFile: ResponseHookFn = async (rawOutput, parsedOutput, param, options) => {
    console.log("writeSingleFile", param, parsedOutput)
    let dir = path.resolve(options.workspace ?? process.cwd())
    let filePath = param
    if (!filePath.startsWith(dir)) {
        filePath = path.join(dir, filePath)
    }

    let content = ""
    if (typeof parsedOutput === "string" && parsedOutput.length > 0) {
        content = parsedOutput
    } else {
        content = rawOutput ?? ""
    }

    try {
        // create parent dirs if needed
        let dirName = path.dirname(filePath)
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true })
        }

        // write the file
        console.log("writeSingleFile filePath", filePath)
        fs.writeFileSync(filePath, content)
        await createEmbedForFile(filePath)
    } catch (e) {
        console.log("writeSingleFile error", e)
    }

    return true
}

const writeFiles: ResponseHookFn = async (_rawOutput, parsedOutput, _param, options) => {
    console.log("writeFiles", parsedOutput)
    // find the files array in the parsed output
    let files: FileItem[] = []
    if (Array.isArray(parsedOutput)) {
        files = [...parsedOutput]
    } else {
        let keys = Object.keys(parsedOutput)
        for (let key of keys) {
            if (Array.isArray(parsedOutput[key])) {
                files = [...parsedOutput[key]]
                break
            }
        }
    }

    // write the files
    for (let file of files) {
        if (file.file && file.content) {
            await writeSingleFile(file.content, file.content, file.file, options)
        }
    }

    return true
}

const WriteFiles: HookPlugin = {
    name: "WriteFilesPlugin",
    funcs: [
        {
            type: "response",
            name: "WriteFiles",
            fn: writeFiles,
        },
        {
            type: "response",
            name: "WriteSingleFile",
            fn: writeSingleFile,
        },
    ],
}

export default WriteFiles
