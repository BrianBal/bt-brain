import { describe, it, expect } from "vitest"
import yamlify from "./yamlify"

describe("yamlify", () => {
    it("should generate YAML string from the given text", () => {
        let input = "This is some text before the code block.\n"
        input += "\n"
        input += "```yaml\n"
        input += "key: value\n"
        input += "```\n"
        input += "\n"
        input += "This is some text after the code block.\n"

        const expected = "key: value\n"
        const result = yamlify(input)
        expect(result).toBe(expected)
    })

    it("should return null if no YAML string is found", () => {
        const input = `This is some text without a code block.`
        const result = yamlify(input)
        expect(result).toBe("")
    })

    it("should handle empty input", () => {
        const input = ""
        const result = yamlify(input)
        expect(result).toBe("")
    })

    it("should handle input with multiple code blocks", () => {
        let input = "This is some text before the first code block.\n"
        input += "\n"
        input += "```yaml\n"
        input += "key1: value1\n"
        input += "```\n"
        input += "\n"
        input += "This is some text between the first and second code blocks.\n"
        input += "\n"
        input += "```yaml\n"
        input += "key2: value2\n"
        input += "```\n"

        const expected = `key1: value1\n`
        const result = yamlify(input)
        expect(result).toBe(expected)
    })
})
