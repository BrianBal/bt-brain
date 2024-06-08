import https from "https"
import { AIRequest } from "./AIRequest"

type OpenAIChatMessage = { role: string; content: string }

/**
 * Sends a request to the OpenAI API to generate a response based on the given user prompt.
 *
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @param {string} systemMessage - The system message to include in the request.
 * @param {object} modelInfo - The model information to use for the request.
 * @param {Array} examples - An array of example messages to include in the request.
 * @return {Promise<string>} A promise that resolves to the generated response from the OpenAI API.
 */
const openaiRequest: AIRequest = async (userPrompt, systemMessage, modelInfo, examples = []) => {
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
        messages: [
            {
                role: "user",
                content: userPrompt,
            },
        ],
    })

    const options = {
        hostname: "api.openai.com",
        port: 443,
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Content-Length": postData.length,
        },
    }

    return new Promise<{ role: string; text: string } | null>((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = ""

            res.on("data", (chunk) => {
                data += chunk
            })

            res.on("end", () => {
                const jsonData: any = JSON.parse(data)
                if (jsonData?.choices?.length ?? 0 > 0) {
                    resolve({
                        role: jsonData.choices[0].message.role,
                        text: jsonData.choices[0].message.content,
                    })
                } else {
                    resolve(null)
                }
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
