import { parse, stringify } from "yaml"
import yamlify from "./parsers/yamlify"
import runGenerate from "./runners/runGenerate"
import asyncExec from "./util/asyncExec"
import Session from "./Session"
import createEmbeds from "./hooks/createEmbeds.js"
import parseCodeBlock from "./parsers/codeBlockify"
import loadTemplates from "./loadTemplates.js"
import runGroup from "./runners/runGroup"
import runCommand from "./runners/runCommand"
import runLoop from "./runners/runLoop.js"
import runWhile from "./runners/runWhile.js"
import ReadFiles from "./hooks/ReadFiles.js"
import WriteFiles from "./hooks/WriteFiles.js"
import SimilarFiles from "./hooks/SimilarFiles.js"
import FileList from "./hooks/FileList.js"

import type { AiTemplate, AiTemplateOptions, AiTemplateVar } from "./AiTemplate.js"
import type { AIChatMessage } from "./requests/AIRequest.js"
import type { HookPlugin, InputHookFn, ResponseHookFn } from "./hooks/hook.js"
import type { AIRequest } from "./requests/AIRequest.js"
import type { ModelInfo } from "./Session"
import { join } from "path"
import { existsSync, readFileSync } from "fs"

type AiTaskData = {
    [key: string]: any
}

export type AiTaskHumanReviewFn = (text: string, context: string) => Promise<string>
export type AiExternalEditFn = (text: string) => void
export type AiTaskBeforeTemplateFn = (msg: string | null | undefined) => void
export type AiTaskAfterTemplateFn = (msg: string | null | undefined) => void

export default class AiTask {
    id: string
    template: AiTemplate
    workspace: string = ""
    data: AiTaskData = {}
    chatMessages: AIChatMessage[] = []
    session: Session
    hooks: HookPlugin[] = []
    requestHandlers: AIRequest[] = []
    requestHumanReview: AiTaskHumanReviewFn = async (text, _context) => {
        return text
    }
    performExternalEdit: AiExternalEditFn = async (text) => {
        return text
    }
    onProgressUpdate: AiExternalEditFn = async (text) => {
        return text
    }

    static async allTemplates(): Promise<AiTemplate[]> {
        return await loadTemplates()
    }

    constructor(workspace: string, template: AiTemplate, data: AiTaskData) {
        let session = Session.get()
        this.id = Date.now().toString()
        this.template = template
        this.workspace = workspace
        let overviewFile = join(session.localConfigDir, "overview.txt")
        let overview = ""
        if (existsSync(overviewFile)) {
            overview = readFileSync(overviewFile, "utf-8")
        }
        this.data = {
            ...data,
            workspace: workspace,
            language: session.language,
            test_framework: session.testFramework,
            cmd_test: session.cmdTest,
            cmd_lint: session.cmdLint,
            cmd_format: session.cmdFormat,
            project_overview: overview,
        }
        this.session = session
        this.hooks = [ReadFiles, WriteFiles, SimilarFiles, FileList]
    }

    get model() {
        let m = this.session.globalConfig.defaultModel
        if (this.template.model) {
            m = this.template.model
        }
        return m
    }

    async summarizeProject() {
        await createEmbeds(this.workspace)
    }

    async start(beforeTemplate: AiTaskBeforeTemplateFn, afterTemplate: AiTaskAfterTemplateFn) {
        // summarize project
        beforeTemplate("🔍 Getting familiar with project")
        await this.summarizeProject()
        await this.processTemplates(this.template, beforeTemplate, afterTemplate)
        beforeTemplate("🏁 Done!")
    }

    async processTemplates(
        startTemplate: AiTemplate,
        beforeTemplate: AiTaskBeforeTemplateFn,
        afterTemplate: AiTaskAfterTemplateFn
    ) {
        // loop through templates
        let templates = [startTemplate]
        while (templates.length > 0) {
            let t = templates.shift()!
            beforeTemplate(t?.wait_message)

            // fill in vars if needed
            if (t.vars) {
                await this.fillInputVars(t.vars)
            }

            // expand group templates
            if (t.type === "group") {
                let expandTemplates = await runGroup(t)
                if (expandTemplates && expandTemplates.length > 0) {
                    templates.splice(0, 0, ...expandTemplates)
                }
            }

            // run ai task template
            if (t.type === "generate") {
                let rawOutput = (await runGenerate(t, this)) ?? ""
                if (t.human_review) {
                    rawOutput = await this.requestHumanReview(
                        rawOutput,
                        this.getData("active_file") // TODO: this could be better
                    )
                }
                await this.handleTemplateOutput(t, rawOutput)
            }

            // run command templates
            if (t.type === "command") {
                let rawOutput = await runCommand(t, this)
                if (t.human_review) {
                    rawOutput = await this.requestHumanReview(
                        rawOutput,
                        this.getData("active_file")
                    )
                }
                await this.handleTemplateOutput(t, rawOutput)
            }

            // loop loopy templates (kinda like a group but with a loop)
            if (t.type === "loop") {
                await runLoop(t, this, beforeTemplate, afterTemplate)
            }

            if (t.type === "while") {
                await runWhile(t, this, beforeTemplate, afterTemplate)
            }

            afterTemplate(t?.wait_message)
        }
    }

    async handleTemplateOutput(template: AiTemplate, rawOutput: string) {
        let parsedOutput = ""
        let respConfig: AiTemplateOptions = template.response ?? {}

        // parse output
        switch (respConfig.format) {
            case "yaml":
                parsedOutput = parse(yamlify(rawOutput))
                break
            case "json":
                parsedOutput = JSON.parse(rawOutput)
                break
            case "codeblock":
                parsedOutput = parseCodeBlock(rawOutput)
                break
            default:
                parsedOutput = rawOutput
        }

        // run hooks to write files, or something do something else with output
        let respConfigHooks = respConfig.hooks ?? []
        for (let respHook of respConfigHooks) {
            for (let hook of this.hooks) {
                for (let hookfn of hook.funcs) {
                    if (hookfn.type === "response" && hookfn.name === respHook.name) {
                        let fn = hookfn.fn as ResponseHookFn
                        let param = respHook.param ? this.getData(respHook.param) : null
                        let options = respConfig.options ?? {}
                        options.workspace = this.workspace
                        options.language = this.data.language
                        options.test_framework = this.data.test_framework
                        options.cmd_test = this.data.cmd_test
                        options.cmd_lint = this.data.cmd_lint
                        options.cmd_format = this.data.cmd_format
                        await fn(rawOutput, parsedOutput, param, options)
                    }
                }
            }
        }

        // external edit
        if (respConfig.external_edit) {
            this.performExternalEdit(parsedOutput ?? rawOutput)
        }

        // save data
        if (respConfig.save_data) {
            let sd = respConfig.save_data
            this.setData(sd.key, parsedOutput ?? rawOutput, sd.data_type, sd.modifier)
        }
    }

    async fillInputVars(vars: AiTemplateVar[]) {
        let modelInfo: ModelInfo = this.session.getModel(this.template.model ?? "defaultModel")

        // fill in vars if needed
        if (Array.isArray(vars)) {
            for (let v of vars) {
                for (let hook of this.hooks) {
                    for (let hookfn of hook.funcs) {
                        if (hookfn.type === "input" && hookfn.name === v.type) {
                            let param = v.param ? this.getData(v.param) ?? v.param : null
                            let options = v.options ?? {}
                            options.workspace = this.workspace
                            options.language = this.data.language
                            options.test_framework = this.data.test_framework
                            options.cmd_test = this.data.cmd_test
                            options.cmd_lint = this.data.cmd_lint
                            options.cmd_format = this.data.cmd_format
                            if (!options.max_tokens) {
                                options.max_tokens = modelInfo.maxInputTokens ?? 4096
                            }

                            let fn = hookfn.fn as InputHookFn
                            let data = await fn(param, options)
                            this.setData(v.name, data, v.dataType, v.modifier)
                        }
                    }
                }
            }
        }
    }

    //// Workflow helpers

    async isGitRepo() {
        // return true if workspace is a git repo otherwise false
        let output = await asyncExec(`git -C ${this.workspace} rev-parse --is-inside-work-tree`)
        return output.stdout === "true"
    }

    async isGitClean() {
        // return true if git repo is clean
        let output = await asyncExec(`git -C ${this.workspace} status --porcelain`)
        return output.stdout.trim() === ""
    }

    //// Hooks for aiTemplate
    getChatMessages() {
        return this.chatMessages
    }

    addChatMessage(role: string, text: string) {
        this.chatMessages.push({ role, text })
    }

    clearChatMessages() {
        this.chatMessages = []
    }

    setData(key: string, rawValue: any, dataType: string = "none", modifier: string = "none") {
        let value = rawValue

        // coerce to correct type
        switch (dataType) {
            case "number":
                switch (typeof value) {
                    case "string":
                        value = parseFloat(rawValue)
                        break
                    case "number":
                        break
                    default:
                        throw "invalid number"
                }
                break
            case "boolean":
                switch (typeof value) {
                    case "string":
                        value = value.trim().toLowerCase()
                        value = ["true", "1", "yes", "y", "on", "t", "enabled"].includes(value)
                        break
                    case "number":
                        value = value !== 0
                        break
                    case "boolean":
                        break
                    default:
                        throw "invalid boolean"
                }
                break
            case "string":
                if (Array.isArray(value)) {
                    value = value.join("\n")
                } else {
                    switch (typeof value) {
                        case "string":
                            break
                        case "number":
                            value = value.toString()
                            break
                        case "boolean":
                            value = value.toString()
                            break
                        default:
                            throw "invalid string"
                    }
                }
                break
            case "array":
                switch (typeof value) {
                    case "string":
                        value = value.split("\n")
                }
                if (!Array.isArray(value)) {
                    for (let key of Object.keys(value)) {
                        if (Array.isArray(value[key])) {
                            value = value[key]
                        }
                    }
                    if (!Array.isArray(value)) {
                        throw "invalid array"
                    }
                }
                break
            default:
                break
        }

        // apply modifier
        if (modifier) {
            let currentValue = this.getData(key)
            if (currentValue === undefined || currentValue === null) {
                currentValue = []
            }
            switch (modifier) {
                case "append":
                    if (Array.isArray(currentValue)) {
                        value = currentValue.concat(value)
                    } else if (typeof currentValue === "string") {
                        value = currentValue + value
                    } else {
                        throw "invalid modifier"
                    }
                    break
                case "prepend":
                    if (Array.isArray(currentValue)) {
                        value = value.concat(currentValue)
                    } else if (typeof currentValue === "string") {
                        value = value + currentValue
                    } else {
                        throw "invalid modifier"
                    }
                    break
                default:
                    break
            }
        }

        // set value
        this.data[key] = value
    }

    getData(key: string, format: string = "none") {
        let val = this.data[key]
        if (format === "yaml") {
            return stringify(val)
        }
        if (format === "json") {
            return JSON.stringify(val)
        }
        return val
    }
}
