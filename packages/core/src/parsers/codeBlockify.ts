/**
 * Parses the code block from the given raw output.
 *
 * @param {string} rawOutput - The raw output containing the code block.
 * @return {string} The parsed code block.
 */
export default function codeBlockify(rawOutput: string): string {
    let parsedOutput = ""
    let output = rawOutput ?? ""
    let lines = output.split("\n")
    let isCode = false
    for (let line of lines) {
        if (line.startsWith("```")) {
            isCode = !isCode
            if (!isCode) {
                return parsedOutput
            }
        } else if (isCode) {
            parsedOutput += line + "\n"
        }
    }
    return parsedOutput
}
