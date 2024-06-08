import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest"
import { getValue, setValue } from "./kvs"
import getDB from "./getDB"
import Database from "./Database"

vi.mock("./getDB")

describe("keyValueStore", () => {
    let getDBMock: MockedFunction<typeof getDB> = getDB as MockedFunction<typeof getDB>

    beforeEach(() => {
        getDBMock.mockClear()
    })

    describe("getValue", () => {
        it("should return null if key is not found", async () => {
            getDBMock.mockResolvedValueOnce({
                get: vi.fn().mockResolvedValue(null),
            } as any as Database)
            const value = await getValue("nonExistentKey")
            expect(value).toBeNull()
        })

        it("should return the correct value for a string", async () => {
            getDBMock.mockResolvedValueOnce({
                get: vi.fn().mockResolvedValue({ type: "string", value: "hello" }),
            } as any as Database)
            const value = await getValue("stringKey")
            expect(value).toBe("hello")
        })

        it("should return the correct value for a number", async () => {
            getDBMock.mockResolvedValueOnce({
                get: vi.fn().mockResolvedValue({ type: "number", value: "42" }),
            } as any as Database)
            const value = await getValue("numberKey")
            expect(value).toBe(42)
        })

        it("should return the correct value for a boolean", async () => {
            getDBMock.mockResolvedValueOnce({
                get: vi.fn().mockResolvedValue({ type: "boolean", value: "true" }),
            } as any as Database)
            const value = await getValue("booleanKey")
            expect(value).toBe(true)
        })

        it("should return the correct value for a JSON object", async () => {
            getDBMock.mockResolvedValueOnce({
                get: vi.fn().mockResolvedValue({ type: "json", value: '{"foo":"bar"}' }),
            } as any as Database)
            const value = await getValue("jsonKey")
            expect(value).toEqual({ foo: "bar" })
        })
    })

    describe("setValue", () => {
        it("should set a string value correctly", async () => {
            const runMock = vi.fn()
            getDBMock.mockResolvedValueOnce({ run: runMock } as any as Database)
            await setValue("stringKey", "hello")
            expect(runMock).toHaveBeenCalledWith(
                "INSERT OR REPLACE INTO keyed_values (key, value, type) VALUES (?, ?, ?)",
                "stringKey",
                "hello",
                "string"
            )
        })

        it("should set a number value correctly", async () => {
            const runMock = vi.fn()
            getDBMock.mockResolvedValueOnce({ run: runMock } as any as Database)
            await setValue("numberKey", 42)
            expect(runMock).toHaveBeenCalledWith(
                "INSERT OR REPLACE INTO keyed_values (key, value, type) VALUES (?, ?, ?)",
                "numberKey",
                "42",
                "number"
            )
        })

        it("should set a boolean value correctly", async () => {
            const runMock = vi.fn()
            getDBMock.mockResolvedValueOnce({ run: runMock } as any as Database)
            await setValue("booleanKey", true)
            expect(runMock).toHaveBeenCalledWith(
                "INSERT OR REPLACE INTO keyed_values (key, value, type) VALUES (?, ?, ?)",
                "booleanKey",
                "true",
                "boolean"
            )
        })

        it("should set a JSON object value correctly", async () => {
            const runMock = vi.fn()
            getDBMock.mockResolvedValueOnce({ run: runMock } as any as Database)
            await setValue("jsonKey", { foo: "bar" })
            expect(runMock).toHaveBeenCalledWith(
                "INSERT OR REPLACE INTO keyed_values (key, value, type) VALUES (?, ?, ?)",
                "jsonKey",
                '{"foo":"bar"}',
                "json"
            )
        })
    })
})
