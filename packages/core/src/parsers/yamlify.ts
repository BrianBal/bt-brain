import { parse } from "yaml"

/**
 * Generates a YAML string from the given text.
 *
 * @param {string} text - The text to convert to YAML.
 * @return {string|null} The generated YAML string or null if no YAML string is found.
 */
export default function yamlify(text: string): string {
    // check if text is yaml
    try {
        let yaml = parse(text)
        if (yaml && typeof yaml !== "string") {
            return text
        }
    } catch (e) {
        // expected error
    }

    let lines = text.split("\n")
    let yamlString = null
    for (let line of lines) {
        if (!yamlString && line.startsWith("```")) {
            yamlString = ""
        } else if (yamlString && line.startsWith("```")) {
            return yamlString
        } else if (yamlString !== null) {
            yamlString += line + "\n"
        }
    }
    return ""
}
