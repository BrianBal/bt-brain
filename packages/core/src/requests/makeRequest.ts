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

    console.log("makeRequest start", modelInfo.service, modelInfo.model)
    let resp = null
    if (modelInfo.service === "groq") {
        resp = await groqRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "openai") {
        resp = await openaiRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "anthropic") {
        resp = await anthropicRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "ollama") {
        resp = await ollamaRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "google") {
        resp = await googleRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    console.log("makeRequest resp", resp)

    return resp
}

export default makeRequest
