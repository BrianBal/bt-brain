import { AiTask, Session, loadTemplates } from "core"
import yargs from "yargs/yargs"
import { hideBin } from "yargs/helpers"
import * as path from "path"
import { select, confirm } from "@inquirer/prompts"
import editor from "@inquirer/editor"
import gatherData from "./gatherData"

export async function run() {
    const argv = await yargs(hideBin(process.argv)).argv
    let workspace: string = (argv.workspace ?? process.cwd()) as string
    let session = Session.get(path.resolve(workspace))
    console.log("BRAIN")
    console.log("working in ", session.workspace)
    let templates = await loadTemplates()

    console.log(templates.map((t) => t.id))

    // CHOOSE MODEL
    let defaultModel = session.getModel("defaultModel")
    let models = session.getModels()
    let modelKey = await select<string>({
        message: "Select a model",
        choices: models.map((m) => ({
            name: m.service + " " + m.model,
            value: m.key,
        })),
        default: defaultModel?.key,
    })
    let model = session.getModel(modelKey)

    // CHOOSE TEMPLATE
    let templateId = await select<string>({
        message: "Select a template",
        choices: templates
            .filter((t) => t.visible)
            .map((t) => ({
                name: t.title,
                value: t.id,
            })),
        default: templates[0].id,
    })
    let template = templates.find((t) => t.id === templateId)

    // GATHER DATA
    let data = await gatherData(template!)

    // START TASK
    const beforeTemplate = (msg: string | null | undefined) => {
        console.log("+", msg)
    }
    const afterTemplate = (msg: string | null | undefined) => {
        console.log("-", msg)
    }
    template!.model = model.key
    let task = new AiTask(session.workspace!, template!, data)
    task.requestHumanReview = async (msg: string | null | undefined): Promise<string> => {
        if (!msg) {
            return ""
        }
        let value = await editor({ message: "Human review", default: msg })
        const ok = await confirm({
            message: "Continue?",
        })
        if (!ok) {
            throw new Error("Aborted")
        } else {
            return value
        }
    }
    await task.start(beforeTemplate, afterTemplate)
}

run()
