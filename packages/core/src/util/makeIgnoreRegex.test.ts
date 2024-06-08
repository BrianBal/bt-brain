import { describe, test, expect } from "vitest"
import makeIgnoreRegex from "./makeIgnoreRegex"

describe("makeIgnoreRegex", () => {
    test("should create a regular expression from the provided patterns", () => {
        const patterns = [
            {
                pattern: "example/pattern",
                regex: "/example\\/pattern/i",
                test: "/example/pattern/123",
            },
            {
                pattern: "node_modules/",
                regex: "/node_modules/i",
                test: "/node_modules/123",
            },
            {
                pattern: "*.logs",
                regex: "/.*\\.logs/i",
                test: "/example/some-123/logs/this.log",
            },
        ]

        for (const { pattern, regex } of patterns) {
            const result = makeIgnoreRegex(pattern)
            expect(result).toBeInstanceOf(RegExp)
            expect(result.toString()).toBe(regex)
            expect(result.test(pattern)).toBe(true)
        }
    })
})
