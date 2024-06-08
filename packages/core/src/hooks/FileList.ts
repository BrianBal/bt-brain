import listFiles from "../util/listFiles.js"
import type { HookPlugin, InputHookFn } from "./hook.js"

const inputFileList: InputHookFn = async (workspace, _options = {}): Promise<any> => {
    let files = await listFiles(workspace)
    return files
}

const FileList: HookPlugin = {
    name: "FileListPlugin",
    funcs: [
        {
            type: "input",
            name: "FileList",
            fn: inputFileList,
        },
    ],
}

export default FileList
