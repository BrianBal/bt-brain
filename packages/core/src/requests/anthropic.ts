import https from "https"
import { AIChatMessage, AIStreamingRequest } from "./AIRequest"

type AnthropicChatMessage = {
    role: string
    content: string
}

type AnthropicBody = {
    model: string
    stream: boolean
    messages: AnthropicChatMessage[]
    max_tokens: number
    system?: string
}

/**
 * Sends a request to the Anthropic API to generate a response based on the given user prompt.
 *
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @param {string} systemMessage - The system message to include in the request.
 * @param {object} modelInfo - The model information to use for the request.
 * @param {Array} examples - An array of example messages to include in the request.
 * @param {function} progress - progress update handler.
 * @return {Promise<string>} A promise that resolves to the generated response from the Anthropic API.
 */
const anthropicRequest: AIStreamingRequest = async function (
    prompt,
    system,
    model,
    examples = [],
    progress = (_text: string) => {}
) {
    let apiKey = model.apiKey
    let messages: AnthropicChatMessage[] = examples.map((m) => ({ role: m.role, content: m.text }))
    messages.push({ role: "user", content: prompt })
    if (!apiKey) {
        apiKey = process.env.ANTHROPIC_API_KEY ?? ""
    }
    let body: AnthropicBody = {
        model: model.model,
        stream: true,
        messages: messages,
        max_tokens: model.maxInputTokens ?? 4096,
    }
    if (system) {
        body.system = system
    }

    const postData = JSON.stringify(body)

    const options = {
        hostname: "api.anthropic.com",
        port: 443,
        path: "/v1/messages",
        method: "POST",
        headers: {
            "x-api-key": `${apiKey}`,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        },
    }

    return new Promise<AIChatMessage>((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = ""

            res.on("data", (chunk: ArrayBuffer) => {
                data += chunk.toString()
                let text = parseChunksToText(data)
                progress(text)
            })

            res.on("end", () => {
                let text = parseChunksToText(data)
                if (!text) {
                    console.log("request failed", data)
                    reject(data)
                }
                const resp: AIChatMessage = {
                    role: "assistant",
                    text: text,
                }
                resolve(resp)
            })
        })

        req.on("error", (error) => {
            reject(error)
        })

        req.write(postData)
        req.end()
    })
}

function parseChunksToText(data: string) {
    let responseContent = ""
    const lines = data.split("\n")
    for (const line of lines) {
        let cleanLine = line.replace(/^data:\s/, "")
        try {
            const json = JSON.parse(cleanLine)
            if (json) {
                switch (json.type) {
                    case "content_block_start":
                        if (json.content_block.type === "text") {
                            responseContent += json.content_block.text
                        }
                        break
                    case "content_block_delta":
                        if (json.delta.type === "text_delta") {
                            responseContent += json.delta.text
                        }
                        break
                }
            }
        } catch (e) {
            // error handled
        }
    }
    return responseContent
}

export default anthropicRequest
