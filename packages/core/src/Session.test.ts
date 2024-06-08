import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedFunction } from "vitest"
import fs, { Dirent } from "fs"
import { homedir } from "node:os"
import Session from "./Session"

vi.mock("fs")
vi.mock("node:os")

describe("Session", () => {
    const mHomedir = homedir as MockedFunction<typeof homedir>
    const mExistsSync = fs.existsSync as MockedFunction<typeof fs.existsSync>
    const mReadFileSync = fs.readFileSync as MockedFunction<typeof fs.readFileSync>
    const mReaddirSync = fs.readdirSync as any as MockedFunction<typeof fs.readdirSync>

    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe("loadGlobalConfig", () => {
        it("should load global config if file exists", () => {
            const mockConfig = { version: "1.0.0", someKey: "someValue" }

            mHomedir.mockReturnValue("/home/user")
            mExistsSync.mockReturnValue(true)
            mReadFileSync.mockReturnValue(JSON.stringify(mockConfig))
            mReaddirSync.mockReturnValue(["ignore", "logs", "project.json"] as any as Dirent[])

            let session = new Session()
            // constructor calls loadGlobalConfig

            expect(session.globalConfig).toEqual(mockConfig)
            expect(session.globalConfigPresent).toBe(true)
        })

        it("should not load global config if versions dont match", () => {
            const mockConfig = { version: "1.0.1", someKey: "someValue" }

            mHomedir.mockReturnValue("/home/user")
            mExistsSync.mockReturnValue(true)
            mReadFileSync.mockReturnValue(JSON.stringify(mockConfig))
            mReaddirSync.mockReturnValue(["ignore", "logs", "project.json"] as any as Dirent[])

            let session = new Session()
            // constructor calls loadGlobalConfig

            expect(session.globalConfig).toBeNull()
            expect(session.globalConfigPresent).toBe(false)
        })

        it("should not load global config if file does not exist", () => {
            mHomedir.mockReturnValue("/home/user")
            mExistsSync.mockReturnValue(false)
            mReaddirSync.mockReturnValue(["ignore", "logs", "project.json"] as any as Dirent[])

            let session = new Session()
            session.loadGlobalConfig()

            expect(session.globalConfig).toBeNull()
            expect(session.globalConfigPresent).toBe(false)
        })
    })

    // describe("saveGlobalConfig", () => {
    //     it("should save global config if present", () => {
    //         const mockConfig = { version: "1.0.0", someKey: "someValue" }
    //         const homeDir = "/home/user"
    //         const configDir = "/home/user/.config/brain"
    //         const configPath = "/home/user/.config/brain/config.json"

    //         mHomedir.mockReturnValue("A")
    //         mJoin.mockReturnValue("B")
    //         mExistsSync.mockReturnValueOnce(true)
    //         mReaddirSync.mockReturnValue(["ignore", "logs", "project.json"] as any as Dirent[])

    //         let session = new Session()
    //         session.globalConfig = mockConfig
    //         const mkdirSyncMock = vi.spyOn(fs, "mkdirSync")
    //         const writeFileSyncMock = vi.spyOn(fs, "writeFileSync")

    //         mHomedir.mockReturnValue(homeDir)
    //         mJoin.mockReturnValueOnce(configDir)
    //         mJoin.mockReturnValueOnce(configPath)
    //         mExistsSync.mockReturnValueOnce(false)
    //         session.saveGlobalConfig()

    //         expect(mkdirSyncMock).toHaveBeenCalledWith(configDir, { recursive: true })
    //         expect(writeFileSyncMock).toHaveBeenCalledWith(
    //             configPath,
    //             JSON.stringify(mockConfig, null, 2)
    //         )
    //     })

    //     it("should not save global config if not present", () => {
    //         let session = new Session()
    //         session.globalConfigPresent = false

    //         const mkdirSyncMock = vi.spyOn(fs, "mkdirSync")
    //         const writeFileSyncMock = vi.spyOn(fs, "writeFileSync")

    //         session.saveGlobalConfig()

    //         expect(mkdirSyncMock).not.toHaveBeenCalled()
    //         expect(writeFileSyncMock).not.toHaveBeenCalled()
    //     })
    // })

    // Add more test cases for other methods...
})
