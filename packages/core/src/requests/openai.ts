import https from "https"
import { AIStreamingRequest } from "./AIRequest"

type OpenAIChatMessage = { role: string; content: string }

/**
 * Sends a streaming request to the OpenAI API to generate a response based on the given user prompt.
 *
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @param {string} systemMessage - The system message to include in the request.
 * @param {object} modelInfo - The model information to use for the request.
 * @param {Array} examples - An array of example messages to include in the request.
 * @param {function} progress - Progress update handler.
 * @return {Promise<string>} A promise that resolves to the generated response from the OpenAI API.
 */
const openaiRequest: AIStreamingRequest = async (
    userPrompt,
    systemMessage,
    modelInfo,
    examples = [],
    progress = (_text: string) => {}
) => {
    let messages: OpenAIChatMessage[] = examples.map((m) => ({ role: m.role, content: m.text }))
    if (systemMessage) {
        messages.push({ role: "system", content: systemMessage })
    }
    messages.push({ role: "user", content: userPrompt })
    let apiKey = modelInfo.apiKey
    if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY ?? ""
    }

    const postData = JSON.stringify({
        model: modelInfo.model,
        messages: messages,
        stream: true,
    })

    const options = {
        hostname: "api.openai.com",
        port: 443,
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
    }

    return new Promise<{ role: string; text: string } | null>((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = ""
            res.on("data", (chunk) => {
                const data = chunk.toString()
                responseData += data
                const lines = responseData.split("\n").filter((l: string) => l?.length > 0)

                let text = ""
                for (let line of lines) {
                    if (line.trim()) {
                        let cleanLine = line.replace(/^data:\s/, "")
                        try {
                            if (cleanLine != "[DONE]") {
                                const result = JSON.parse(cleanLine)
                                if (result?.choices?.length > 0) {
                                    let content = result.choices[0].delta.content ?? ""
                                    text += content
                                }
                            } else {
                                resolve({ role: "assistant", text: text })
                                return
                            }
                        } catch (e) {
                            console.log(cleanLine, e)
                        }
                    }
                }
                progress(text)
            })

            res.on("end", () => {
                // should not need to return here
            })
        })

        req.on("error", (error) => {
            reject(error)
        })

        req.write(postData)
        req.end()
    })
}

export default openaiRequest
