export type HookOptions = {
    [key: string]: any
}

export type FileItem = {
    file: string
    content: string
}

export type ResponseHookFn = (
    rawOutput: string | null,
    parsedOutput: any,
    param: any,
    options: HookOptions
) => Promise<boolean>

export type InputHookFn = (param: any, options: HookOptions) => Promise<any>

export type HookFn = {
    type: "input" | "response"
    name: string
    fn: InputHookFn | ResponseHookFn
}

export type HookPlugin = {
    name: string
    funcs: HookFn[]
}
