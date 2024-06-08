import https from "https"
import { AIRequest, AIChatMessage } from "./AIRequest"

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
 * @return {Promise<string>} A promise that resolves to the generated response from the Anthropic API.
 */
const anthropicRequest: AIRequest = async function (prompt, system, model, examples = []) {
    let apiKey = model.apiKey
    let messages: AnthropicChatMessage[] = examples.map((m) => ({ role: m.role, content: m.text }))
    messages.push({ role: "user", content: prompt })
    if (!apiKey) {
        apiKey = process.env.ANTHROPIC_API_KEY ?? ""
    }
    let body: AnthropicBody = {
        model: model.model,
        stream: false,
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
            "Content-Length": postData.length,
        },
    }

    return new Promise<AIChatMessage>((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = ""

            res.on("data", (chunk) => {
                data += chunk
            })

            res.on("end", () => {
                const jsonData: any = JSON.parse(data)
                const resp: AIChatMessage = {
                    role: jsonData.content[0].role,
                    text: jsonData.content[0].text,
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

export default anthropicRequest
