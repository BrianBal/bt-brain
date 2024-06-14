import https from "https"
import { AIStreamingRequest } from "./AIRequest"

type GroqChatMessage = {
    role: string
    content: string
}

/**
 * Sends a request to the Groq API to generate a response based on the given user prompt.
 *
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @param {string} systemMessage - The system message to include in the request.
 * @param {object} modelInfo - The model information to use for the request.
 * @param {Array} examples - An array of example messages to include in the request.
 * @return {Promise<string>} A promise that resolves to the generated response from the Groq API.
 */
const groqRequest: AIStreamingRequest = async (
    prompt,
    system,
    modelInfo,
    examples = [],
    progress
) => {
    let apiKey = modelInfo.apiKey
    let messages: GroqChatMessage[] = examples.map((m) => ({ role: m.role, content: m.text }))
    if (system) {
        messages.push({ role: "system", content: system })
    }
    messages.push({ role: "user", content: prompt })
    if (!apiKey) {
        apiKey = process.env.GROQ_API_KEY ?? ""
    }

    const postData = JSON.stringify({
        messages: messages,
        model: modelInfo.model,
        stream: false,
    })

    const options = {
        hostname: "api.groq.com",
        port: 443,
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
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
                if (jsonData?.choices) {
                    progress(jsonData.choices[0].message.content)
                    resolve({
                        role: jsonData.choices[0].message.role,
                        text: jsonData.choices[0].message.content,
                    })
                } else {
                    console.log("request failed", jsonData)
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

export default groqRequest
