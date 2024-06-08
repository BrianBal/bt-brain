import Session from "../Session"
import googleRequest from "./google"
import ollamaRequest from "./ollama"
import anthropicRequest from "./anthropic"
import openaiRequest from "./openai"
import groqRequest from "./groq"
import type { AIChatMessage } from "./AIRequest"

const makeRequest = async (
    userPrompt: string,
    systemMessage: string,
    modelKey: string,
    examples: AIChatMessage[] = []
): Promise<AIChatMessage | null> => {
    let session = Session.get()
    let modelInfo = session.getModel(modelKey)
    if (!modelInfo) {
        throw "Model not found"
    }

    if (modelInfo.service === "groq") {
        return await groqRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "openai") {
        return await openaiRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "anthropic") {
        return await anthropicRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "ollama") {
        return await ollamaRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "google") {
        return await googleRequest(userPrompt, systemMessage, modelInfo, examples)
    }

    return null
}

export default makeRequest
