import { describe, expect, vi, it, MockedFunction } from "vitest"
import listFiles from "../util/listFiles"
import FileList from "./FileList"
import { InputHookFn } from "./hook"
import { beforeEach } from "node:test"

vi.mock("../util/listFiles")
let listFilesMock: MockedFunction<typeof listFiles> = listFiles as any

describe("FileListPlugin", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("should be shaped correctly", () => {
        expect(FileList.name).toBe("FileListPlugin")
        expect(Array.isArray(FileList.funcs)).toBe(true)
        expect(FileList.funcs).toHaveLength(1)
        expect(FileList.funcs[0].type).toBe("input")
        expect(FileList.funcs[0].name).toBe("ReadFile")
        expect(typeof FileList.funcs[0].fn).toBe("function")
    })

    it("should return a list of files", async () => {
        listFilesMock.mockResolvedValueOnce(["file1", "file2"])
        let fn = FileList.funcs[0].fn as InputHookFn
        const result = await fn("workspace", {})
        expect(result).toEqual(["file1", "file2"])
        expect(listFilesMock).toHaveBeenCalledWith("workspace")
    })

    it("should return null if there are no files", async () => {
        listFilesMock.mockResolvedValueOnce([])
        let fn = FileList.funcs[0].fn as InputHookFn
        const result = await fn("workspace", {})
        expect(result).toEqual([])
    })
})
