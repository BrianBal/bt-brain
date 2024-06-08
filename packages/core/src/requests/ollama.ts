import { AIRequest } from "./AIRequest"
import http from "http"

/**
 * Sends a request to the Ollama API to generate a response based on the given user prompt.
 *
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @param {string} systemMessage - The system message to include in the request.
 * @param {object} modelInfo - The model information to use for the request.
 * @param {Array} examples - An array of example messages to include in the request. { role, text }
 * @return {Promise<string>} A promise that resolves to the generated response from the Ollama API.
 */
const ollamaRequest: AIRequest = async (userPrompt, systemMessage, modelInfo, history = []) => {
    let messages = history.map((m) => ({ role: m.role, content: m.text }))
    if (systemMessage) {
        messages.splice(0, 0, { role: "system", content: systemMessage })
    }
    let start = Date.now()
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
        const req = http.request(options, (res) => {
            let data = ""
            res.on("data", (chunk) => {
                data += chunk
            })
            res.on("end", () => {
                let end = Date.now()
                console.log("Ollama request took", (end - start) / 1000, "seconds")
                try {
                    const parsedData = JSON.parse(data)
                    if (parsedData?.message) {
                        resolve({
                            role: parsedData.message.role,
                            text: parsedData.message.content,
                        })
                    } else {
                        resolve(null)
                    }
                } catch (error) {
                    reject(error)
                }
            })
        })

        req.on("error", (error) => {
            reject(error)
        })

        req.write(
            JSON.stringify({
                model: modelInfo.model,
                messages: messages,
                stream: false,
                keep_alive: "15m",
            })
        )
        req.end()
    })
}

export default ollamaRequest
