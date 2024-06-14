import type { FileItem, HookPlugin, InputHookFn } from "./hook.js"
import Session from "../Session.js"
import asyncExec from "../util/asyncExec.ts"
import sanitizeForCLI from "../util/sanitizeForCLI.ts"
import makeRequest from "../requests/makeRequest.ts"
import { readFile, stat } from "fs/promises"
import * as path from "path"
import { AIChatMessage } from "../requests/AIRequest.ts"

const similarFiles: InputHookFn = async (content, options = {}) => {
    let session = Session.get()
    let dir = options.workspace ?? process.cwd()
    let keywordsMsg: AIChatMessage | null = null
    if (!options.noKeyWords) {
        let prompt = `${content}\n\n\nfind any keywords, variable, functions, libraries, directories and files in the task description above. The keywords will be used to search for similar files. Ignore any Example output.  Output the keywords in a comman seperated list. DO NOT OUTPUT anything else`
        keywordsMsg = await makeRequest(
            prompt,
            "You are a helpful assistant",
            "defaultSmallModel",
            [],
            (_text: string) => {}
        )
    }

    let num = 10
    if (options.numResults) {
        try {
            num = parseInt(options.numResults, 10)
        } catch (e) {
            num = 10
        }
    }
    let sanitizedContent = sanitizeForCLI(keywordsMsg?.text ?? content)
    let output = await asyncExec(
        `llm similar -n ${num} -d ${session.embedsDatabaseFile} -c "${sanitizedContent}" code`
    )
    let files: FileItem[] = []
    if (output.stdout) {
        let lines = output.stdout.split("\n")
        for (let line of lines) {
            try {
                let json = JSON.parse(line)
                let codeFilePath = null
                let testFilePath = null
                let extParts = json.id.split(".")
                let ext = extParts[extParts.length - 1]
                if (json.id.endsWith(`.test.${ext}`)) {
                    testFilePath = json.id
                    codeFilePath = json.id.replace(`.test.${ext}`, `.${ext}`)
                } else {
                    codeFilePath = json.id
                    testFilePath = json.id.replace(`.${ext}`, `.test.${ext}`)
                }

                if (codeFilePath) {
                    try {
                        let f = path.join(dir, codeFilePath)
                        let fStat = await stat(f)
                        if (fStat.isFile()) {
                            let content = await readFile(f, "utf-8")
                            files.push({
                                file: codeFilePath,
                                content: content,
                            })
                        }
                    } catch (e) {
                        // error handled nothing else to do
                    }
                }
                if (testFilePath) {
                    try {
                        let f = path.join(dir, testFilePath)
                        let fStat = await stat(f)
                        if (fStat.isFile()) {
                            let content = await readFile(f, "utf-8")
                            files.push({
                                file: testFilePath,
                                content: content,
                            })
                        }
                    } catch (e) {
                        // error handled nothing else to do
                    }
                }
            } catch (e) {
                // error handled nothing else to do
                console.log("similarFiles error", e)
            }
        }
    }

    return files
}

const similarFilesToFile: InputHookFn = async (file, options = {}) => {
    let session = Session.get()
    let dir = options.workspace ?? process.cwd()
    let fp = file
    if (!fp.startsWith(dir)) {
        fp = path.resolve(path.join(dir, fp))
    }
    let id = fp.replace(dir + "/", "")

    let maxTokens = 4096
    if (options.max_tokens) {
        maxTokens = parseInt(options.max_tokens, 10)
    }

    let num = 1000
    if (options.numResults) {
        try {
            num = parseInt(options.numResults, 10)
        } catch (e) {
            num = 10
        }
    }

    let cmd = `llm similar -n ${num} -d ${session.embedsDatabaseFile} code "${id}"`
    let output = await asyncExec(cmd)
    let tokenCount = 0
    let files: FileItem[] = []
    if (output.stdout) {
        let lines = output.stdout.split("\n")
        for (let line of lines) {
            try {
                let json = JSON.parse(line)
                let codeFilePath = null
                let testFilePath = null
                let extParts = json.id.split(".")
                let ext = extParts[extParts.length - 1]
                if (json.id.endsWith(`.test.${ext}`)) {
                    testFilePath = json.id
                    codeFilePath = json.id.replace(`.test.${ext}`, `.${ext}`)
                } else {
                    codeFilePath = json.id
                    testFilePath = json.id.replace(`.${ext}`, `.test.${ext}`)
                }

                if (codeFilePath) {
                    let f = path.join(dir, codeFilePath)
                    try {
                        let fStat = await stat(f)
                        if (fStat.isFile()) {
                            let content = await readFile(f, "utf-8")
                            tokenCount += Math.round(content.length / 4)
                            files.push({
                                file: codeFilePath,
                                content: content,
                            })
                        }
                    } catch (e) {
                        // error handled nothing else to do
                    }
                }
                if (testFilePath) {
                    try {
                        let f = path.join(dir, testFilePath)
                        let fStat = await stat(f)
                        if (fStat.isFile()) {
                            let content = await readFile(f, "utf-8")
                            tokenCount += Math.round(content.length / 4)
                            files.push({
                                file: testFilePath,
                                content: content,
                            })
                        }
                    } catch (e) {
                        // error handled nothing else to do
                    }
                }
            } catch (e) {
                // error handled nothing else to do
                console.log("similarFilesToFile error", e)
            }
            if (tokenCount > maxTokens) {
                break
            }
        }
    }
    // console.log("SimilarFilesToFile files", files)
    if (files.length === 0) {
        let basename = path.basename(fp)
        files = await similarFiles(basename, { ...options, noKeyWords: true })
    }

    return files
}

const SimilarFiles: HookPlugin = {
    name: "SimilarFilesPlugin",
    funcs: [
        {
            type: "input",
            name: "SimilarFiles",
            fn: similarFiles,
        },
        {
            type: "input",
            name: "SimilarFilesToFile",
            fn: similarFilesToFile,
        },
    ],
}

export default SimilarFiles
