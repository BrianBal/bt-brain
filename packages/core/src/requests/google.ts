import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai"
import { AIRequest, AIChatMessage } from "./AIRequest"

const googleRequest: AIRequest = async (prompt, system, modelInfo, _examples = []) => {
    // Initialize Vertex with your Cloud project and location
    const vertex_ai = new VertexAI({ project: modelInfo.project, location: modelInfo.location })
    const model = modelInfo.model

    // Instantiate the models
    const generativeModel = vertex_ai.preview.getGenerativeModel({
        model: model,
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 1,
            topP: 0.95,
        },
        systemInstruction: {
            parts: [{ text: system }],
            role: "system",
        },
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        ],
    })

    const request = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    }
    const result = await generativeModel.generateContent(request)
    const response = result.response
    if (response.candidates?.length === 0) {
        let msg: AIChatMessage = {
            role: response.candidates[0].content.role,
            text: response.candidates[0].content.parts[0].text ?? "",
        }
        return msg
    }
    return null
}
export default googleRequest
