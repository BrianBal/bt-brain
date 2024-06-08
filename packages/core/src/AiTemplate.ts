export type AiTemplateOptions = {
    [key: string]: any
}

export type AiTemplateResponse = {
    format: string
    hook: string
    write_to_file?: string
    options?: AiTemplateOptions
    save_data?: AiSaveData
}

export type AiTemplateVar = {
    name: string
    type?: string
    format?: string
    form?: string
    param?: string
    dataType?: string
    modifier?: string
    options?: AiTemplateOptions
}

export type AiSaveData = {
    key: string
    data_type?: string
    modifier?: string
}

export type AiTemplateLoop = {
    items_key: string
    item_key: string
    data_type?: string
    vars?: AiTemplateVar[]
}

export type AiTemplateWhile = {
    key: string
    until_value: any
    data_type?: string
    vars?: AiTemplateVar[]
}

export type AiTaskItem = {
    id: string
}

export type AiTemplate = {
    id: string
    type: "generate" | "group" | "command" | "loop" | "while"
    title?: string
    description?: string
    wait_message?: string
    human_review?: boolean
    visible?: boolean
    model?: string
    response?: AiTemplateResponse
    vars?: AiTemplateVar[]
    system?: string
    template?: string
    command?: string
    return_code?: string
    loop?: AiTemplateLoop
    while?: AiTemplateWhile
    tasks?: AiTaskItem[]
    filename: string
    testresult?: string
}
