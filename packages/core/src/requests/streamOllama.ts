import type { AIStreamingRequest } from "./AIRequest"
import http from "http"

/**
 * Sends a request to the Ollama API to generate a response based on the given user prompt.
 *
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @param {string} systemMessage - The system message to include in the request.
 * @param {object} modelInfo - The model information to use for the request.
 * @param {Array} examples - An array of example messages to include in the request. { role, text }
 * @param {function} examples - progress update handler
 * @return {Promise<string>} A promise that resolves to the generated response from the Ollama API.
 */
const streamOllamaRequest: AIStreamingRequest = async (
    userPrompt,
    systemMessage,
    modelInfo,
    history = [],
    progress
) => {
    let messages = history.map((m) => ({ role: m.role, content: m.text }))
    if (systemMessage) {
        messages.splice(0, 0, { role: "system", content: systemMessage })
    }
    messages.push({ role: "user", content: userPrompt })

    const options = {
        hostname: "localhost",
        port: 11434,
        path: "/api/chat",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    }

    return new Promise((resolve, reject) => {
        let responseText = ""
        const req = http.request(options, (res) => {
            res.on("data", (chunk: ArrayBuffer) => {
                const data = chunk.toString()
                const lines = data.split("\n")

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const result = JSON.parse(line)
                            let content = result.message?.content ?? ""
                            responseText += content
                            progress(responseText)

                            if (result.done) {
                                resolve({ text: responseText, role: "assistant" })
                            }
                        } catch (e) {
                            console.log(e)
                        }
                    }
                }
            })
            res.on("end", () => {
                resolve({ text: responseText, role: "assistant" })
            })
        })

        req.on("error", (error) => {
            reject(error)
        })

        req.write(
            JSON.stringify({
                model: modelInfo.model,
                messages: messages,
                stream: true,
                keep_alive: "2m",
            })
        )
        req.end()
    })
}

export default streamOllamaRequest
