import { beforeEach, describe, expect, it, vi } from "vitest"
import { readFile, stat } from "node:fs/promises"
import * as path from "path"
import { InputHookFn } from "../hooks/hook"
import ReadFiles from "../hooks/ReadFiles"

vi.mock("fs/promises")

describe("ReadFilesPlugin", () => {
    let readFileMock = vi.mocked(readFile)
    let statMock = vi.mocked(stat)

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("should be shaped correctly", () => {
        expect(ReadFiles.name).toBe("ReadFilesPlugin")
        expect(Array.isArray(ReadFiles.funcs)).toBe(true)
        expect(ReadFiles.funcs).toHaveLength(2)

        expect(ReadFiles.funcs[0].type).toBe("input")
        expect(ReadFiles.funcs[0].name).toBe("ReadFile")
        expect(typeof ReadFiles.funcs[0].fn).toBe("function")

        expect(ReadFiles.funcs[1].type).toBe("input")
        expect(ReadFiles.funcs[1].name).toBe("ReadFiles")
        expect(typeof ReadFiles.funcs[1].fn).toBe("function")
    })

    it("should read the contents of a file", async () => {
        const filePath = "path/to/file.txt"
        const workspace = "path/to/workspace"
        const encoding = "utf8"
        const fileContents = "Hello, world!"

        readFileMock.mockResolvedValue(Buffer.from(fileContents, encoding))
        statMock.mockResolvedValue({ isFile: () => true } as any)

        const inputReadFiles = ReadFiles.funcs[0].fn as InputHookFn
        const result = await inputReadFiles(filePath, { workspace, encoding })

        expect(result).toBe(fileContents)
        expect(readFileMock).toHaveBeenCalledWith(path.resolve(workspace, filePath), encoding)
    })

    it("should return an empty string if the file does not exist", async () => {
        const filePath = "path/to/file.txt"
        const workspace = "path/to/workspace"
        const encoding = "utf8"

        readFileMock.mockRejectedValueOnce(new Error("File not found"))
        statMock.mockResolvedValue({ isFile: () => false } as any)

        const inputReadFiles = ReadFiles.funcs[0].fn as InputHookFn
        const result = await inputReadFiles(filePath, { workspace, encoding })

        expect(result).toBe("")
        expect(readFileMock).toHaveBeenCalledWith(path.resolve(workspace, filePath), encoding)
    })

    it("should return an empty string if the file does not exist", async () => {
        const filePath = "path/to/file.txt"
        const workspace = "path/to/workspace"
        const encoding = "utf8"

        readFileMock.mockRejectedValueOnce(new Error("File not found"))
        statMock.mockResolvedValue({ isFile: () => false } as any)

        const inputReadFiles = ReadFiles.funcs[0].fn as InputHookFn
        const result = await inputReadFiles(filePath, { workspace, encoding })

        expect(result).toBe("")
        expect(readFileMock).toHaveBeenCalledWith(path.resolve(workspace, filePath), encoding)
    })
})
