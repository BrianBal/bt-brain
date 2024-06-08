import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest"
import * as fs from "fs"
import type { Dirent } from "fs"
import listFiles from "./listFiles"
import Session from "../Session"
import makeIgnoreRegex from "./makeIgnoreRegex"

vi.mock("fs")
vi.mock("./makeIgnoreRegex")
vi.mock("../Session")

const readdirSyncMock: MockedFunction<typeof fs.readdirSync> = fs.readdirSync as any
const existsSyncMock: MockedFunction<typeof fs.existsSync> = fs.existsSync as any
const readFileSyncMock: MockedFunction<typeof fs.readFileSync> = fs.readFileSync as any
const makeIgnoreRegexMock: MockedFunction<typeof makeIgnoreRegex> = makeIgnoreRegex as any

describe("listFiles", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("should return an empty array for an empty directory", async () => {
        const mockSessionGet = vi.spyOn(Session, "get")
        mockSessionGet.mockReturnValue({
            ignoreFile: "I",
        } as any)

        readdirSyncMock.mockReturnValue([])
        const dirPath = "/path/to/dir"

        const result = await listFiles(dirPath)

        expect(result).toEqual([])
        expect(readdirSyncMock).toHaveBeenCalledWith(dirPath, { withFileTypes: true })
    })

    it("should list files in a directory", async () => {
        const mockSessionGet = vi.spyOn(Session, "get")
        mockSessionGet.mockReturnValue({
            ignoreFile: "I",
        } as any)

        readdirSyncMock.mockReturnValue([])
        readdirSyncMock.mockReturnValueOnce([
            {
                isFile: vi.fn().mockReturnValue(true),
                isDirectory: vi.fn().mockReturnValue(false),
                name: "file1.txt",
            } as any as Dirent,
            {
                isFile: vi.fn().mockReturnValue(true),
                isDirectory: vi.fn().mockReturnValue(false),
                name: "file2.js",
            } as any as Dirent,
            {
                isFile: vi.fn().mockReturnValue(false),
                isDirectory: vi.fn().mockReturnValue(true),
                name: "subdir",
            } as any as Dirent,
        ])

        existsSyncMock.mockReturnValue(true)
        readFileSyncMock.mockReturnValue("B")
        makeIgnoreRegexMock.mockReturnValue(new RegExp("I"))

        const dirPath = "/path/to/dir"
        const result = await listFiles(dirPath)

        expect(result).toEqual(["/path/to/dir/file1.txt", "/path/to/dir/file2.js"])
        expect(readdirSyncMock).toHaveBeenCalledWith(dirPath, { withFileTypes: true })
    })

    // it("should ignore hidden files and directories", () => {
    //     const readdirSyncMock = vi.spyOn(fs, "readdirSync").mockReturnValue([
    //         {
    //             isFile: vi.fn().mockReturnValue(true),
    //             name: ".hiddenfile",
    //         } as any as Dirent,
    //         {
    //             isDirectory: vi.fn().mockReturnValue(true),
    //             name: ".hiddendir",
    //         } as any as Dirent,
    //         {
    //             isFile: vi.fn().mockReturnValue(true),
    //             name: "file.txt",
    //         } as any as Dirent,
    //     ])
    //     const dirPath = "/path/to/dir"

    //     const result = listFiles(dirPath)

    //     expect(result).toEqual(["/path/to/dir/file.txt"])
    //     expect(readdirSyncMock).toHaveBeenCalledWith(dirPath, { withFileTypes: true })
    // })

    // it("should ignore files based on .gitignore patterns", () => {
    //     const readdirSyncMock = vi.spyOn(fs, "readdirSync").mockReturnValue([
    //         {
    //             isFile: vi.fn().mockReturnValue(true),
    //             name: "file1.txt",
    //         } as any as Dirent,
    //         {
    //             isFile: vi.fn().mockReturnValue(true),
    //             name: "file2.js",
    //         } as any as Dirent,
    //         {
    //             isFile: vi.fn().mockReturnValue(true),
    //             name: "ignoredFile.txt",
    //         } as any as Dirent,
    //     ])
    //     const existsSyncMock = vi.spyOn(fs, "existsSync").mockReturnValue(true)
    //     const readFileSyncMock = vi.spyOn(fs, "readFileSync").mockReturnValue("*.txt")
    //     const dirPath = "/path/to/dir"

    //     const result = listFiles(dirPath)

    //     expect(result).toEqual(["/path/to/dir/file2.js"])
    //     expect(readdirSyncMock).toHaveBeenCalledWith(dirPath, { withFileTypes: true })
    //     expect(existsSyncMock).toHaveBeenCalledWith("/path/to/.gitignore")
    //     expect(readFileSyncMock).toHaveBeenCalledWith("/path/to/.gitignore", "utf-8")
    // })
})
