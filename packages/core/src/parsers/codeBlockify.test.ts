import { describe, it, expect } from "vitest"
import codeBlockify from "./codeBlockify"

describe("codeBlockify", () => {
    it("should parse code block from raw output", () => {
        let rawOutput = "This is some text before the code block.\n"
        rawOutput += "\n"
        rawOutput += "```\n"
        rawOutput += "This is the code block.\n"
        rawOutput += "It can span multiple lines.\n"
        rawOutput += "```\n"
        rawOutput += "\n"
        rawOutput += "This is some text after the code block.\n"

        const expected = `This is the code block.\nIt can span multiple lines.\n`
        const result = codeBlockify(rawOutput)
        expect(result).toBe(expected)
    })

    it("should handle empty input", () => {
        const rawOutput = ""
        const expected = ""
        const result = codeBlockify(rawOutput)
        expect(result).toBe(expected)
    })

    it("should handle input without code block", () => {
        const rawOutput = "This is some text without a code block."
        const expected = ""
        const result = codeBlockify(rawOutput)
        expect(result).toBe(expected)
    })

    it("should handle input with multiple code blocks", () => {
        let rawOutput = "This is some text before the first code block.\n"
        rawOutput += "\n"
        rawOutput += "```\n"
        rawOutput += "This is the first code block.\n"
        rawOutput += "```\n"
        rawOutput += "\n"
        rawOutput += "This is some text between the first and second code blocks.\n"
        rawOutput += "\n"
        rawOutput += "```\n"
        rawOutput += "This is the second code block.\n"
        rawOutput += "```\n"
        rawOutput += "\n"
        rawOutput += "This is some text after the second code block.\n"

        const expected = "This is the first code block.\n"
        const result = codeBlockify(rawOutput)
        expect(result).toBe(expected)
    })
})
