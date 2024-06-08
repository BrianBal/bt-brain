export function version(): string {
    return "1.0.0"
}

export { default as AiTask } from "./AiTask"
export { default as loadTemplates } from "./loadTemplates"
export { default as Session } from "./Session"
export { setValue, getValue } from "./data/kvs"

export type {
    AiTemplate,
    AiTemplateOptions,
    AiTemplateResponse,
    AiTemplateVar,
    AiSaveData,
    AiTemplateLoop,
    AiTemplateWhile,
    AiTaskItem,
} from "./AiTemplate"
