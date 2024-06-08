import * as fs from "fs"
import * as path from "path"
import makeIgnoreRegex from "./makeIgnoreRegex"
import Session from "../Session"
import asyncExec from "./asyncExec"

/**
 * Retrieves a list of files from the specified directory recursively, excluding hidden and ignored files.
 *
 * @param {string} dirPath - The path of the directory to list files from.
 * @return {Array} An array containing the paths of all non-hidden and non-ignored files in the directory.
 */
export default async function listFiles(dirPath: string): Promise<string[]> {
    const session = Session.get()
    const fileList: string[] = []
    // expand dirPath to absolute path
    let ignorePatterns = loadIgnorePatterns(session.ignoreFile)

    async function walkDir(currentPath: string) {
        const files = fs.readdirSync(currentPath, { withFileTypes: true })
        for (const file of files) {
            const filePath = path.join(currentPath, file.name)
            let ignore = await shouldIgnoreFile(filePath, ignorePatterns)
            if (!ignore) {
                if (file.isFile()) {
                    fileList.push(filePath)
                } else if (file.isDirectory()) {
                    await walkDir(filePath)
                }
            }
        }
    }

    await walkDir(dirPath)
    return fileList
}

function loadIgnorePatterns(ignoreFilePath: string): RegExp[] {
    if (!fs.existsSync(ignoreFilePath)) {
        return [] // No .gitignore file, return empty list
    }
    try {
        const ignoreContent = fs.readFileSync(ignoreFilePath, "utf-8")
        return parseIgnorePatterns(ignoreContent)
    } catch (error: any) {
        console.error("Error loading .gitignore:", error.message)
        return [] // Handle errors gracefully
    }
}

function parseIgnorePatterns(ignoreContent: string): RegExp[] {
    const patterns: string[] = []
    const lines = ignoreContent.split("\n")
    for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith("#")) {
            // Skip comments and empty lines
            patterns.push(trimmedLine)
        }
    }
    return patterns.map((p) => makeIgnoreRegex(p))
}

async function shouldIgnoreFile(filePath: string, rules: RegExp[]): Promise<boolean> {
    if (filePath.includes(".git")) {
        return true
    }
    if (filePath.includes("node_modules")) {
        return true
    }
    if (filePath.includes(".vscode")) {
        return true
    }
    if (filePath.includes("package-lock.json") || filePath.includes("pnpm-lock.yaml")) {
        return true
    }
    if (fs.statSync(filePath).isDirectory()) {
        return false
    }
    let isText = await isTextFile(filePath)
    return isIgnoredFile(filePath, rules) || !isText
}

async function isTextFile(filePath: string): Promise<boolean> {
    let result = await asyncExec(`file -b --mime-type ${filePath}`)
    let mimeType = result.stdout as string
    if (mimeType === null) {
        return true
    }
    if (filePath.endsWith(".ts")) {
        // typescript is ok
        return true
    }
    const okTypes = ["text/", "application/json"]
    for (const type of okTypes) {
        if (mimeType.startsWith(type)) {
            return true
        }
    }

    return false
}

function isIgnoredFile(filePath: string, ignorePatterns: RegExp[]): boolean {
    for (const pattern of ignorePatterns) {
        if (pattern.test(filePath)) {
            return true
        }
    }
    return false
}
