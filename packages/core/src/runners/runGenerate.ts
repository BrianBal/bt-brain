import makeRequest from "../requests/makeRequest"
import * as fs from "fs"
import Session from "../Session"
import type { AiTemplate } from "../AiTemplate"
import AiTask from "../AiTask"
import { AIChatMessage } from "../requests/AIRequest"

/**
 * Generates an AI response base on a given template and data set.
 *
 * @param {Task} task - The task object {@link Task}.
 * @return {Promise<Task>} The request and response in task form {@link Task}.
 */
export default async function runGenerate(
    template: AiTemplate,
    task: AiTask
): Promise<string | null> {
    // console.log("runGenerate template", template)
    // console.log("runGenerate task", task)
    let system = template.system!
    let input = template.template!
    let session = Session.get()

    if (template.vars) {
        for (let v of template.vars) {
            let val = task.getData(v.name, v.format)
            // console.log("runGenerate val", v.name, v.format, val)

            // fill in system template
            system = system.replaceAll(`__${v.name}__`, val)

            // fill in user template
            input = input.replaceAll(`__${v.name}__`, val)
        }
    }
    // console.log("runGenerate system", system)
    // console.log("runGenerate input", input)

    let logsDir = session.logsDir
    if (fs.existsSync(logsDir)) {
        let fn = `${logsDir}/${task.id}-${Date.now()}-${template.id}-a.log`
        let fc = `MODEL: ${task.model}\n`
        fc += "\n\n-------------------------------------\n\n"
        fc += system
        fc += "\n\n-------------------------------------\n\n"
        fc += input
        fs.writeFileSync(fn, fc)
    }

    let msg: AIChatMessage | null = null
    if (!template.testresult) {
        msg = await makeRequest(
            input,
            system,
            task.model,
            task.getChatMessages(),
            task.onProgressUpdate
        )
    } else {
        msg = {
            role: "assistant",
            text: template.testresult,
        }
    }

    if (msg && fs.existsSync(logsDir)) {
        let fn = `${logsDir}/${task.id}-${Date.now()}-${template.id}-b.log`
        fs.writeFileSync(fn, msg.text)
    }

    return msg?.text ?? null
}
