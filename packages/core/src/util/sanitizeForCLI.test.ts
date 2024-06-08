import { describe, it, expect } from "vitest"
import sanitizeForCLI from "./sanitizeForCLI"

describe("sanitizeForCLI", () => {
    it("should escape special characters", () => {
        const input = "Hello \"World\" `test` 'quote' $variable"
        const expected = `Hello \\"World\\" \\\`test\\\` \\'quote\\' \\$variable`
        const result = sanitizeForCLI(input)
        expect(result).toBe(expected)
    })

    it("should handle empty string", () => {
        const input = ""
        const expected = ""
        const result = sanitizeForCLI(input)
        expect(result).toBe(expected)
    })

    it("should handle string without special characters", () => {
        const input = "HelloWorld"
        const expected = "HelloWorld"
        const result = sanitizeForCLI(input)
        expect(result).toBe(expected)
    })

    it("should throw an error for non-string input", () => {
        const input = 123
        expect(() => sanitizeForCLI(input as any as string)).toThrow(TypeError)
    })
})
