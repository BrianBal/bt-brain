import { AiTemplate } from "../AiTemplate"
import AiTask from "../AiTask"
import asyncExec, { ExecResult } from "../util/asyncExec"
import sanitizeForCLI from "../util/sanitizeForCLI"

export default async function runCommand(template: AiTemplate, task: AiTask): Promise<string> {
    let command = template.command!
    if (Array.isArray(template.vars)) {
        for (let v of template.vars) {
            let value = task.getData(v.name)
            let safeValue = sanitizeForCLI(value)
            command = command.replaceAll(`__${v.name}__`, safeValue)
        }
    }
    console.log("runCommand", command)
    let result: ExecResult | null = null
    if (!template.testresult) {
        result = await asyncExec(command)
    } else {
        let lines = template.testresult.split("\n")
        let fl = "0"
        if (lines && lines.length > 0) {
            fl = lines[0]
        }
        let code = fl ? parseInt(fl, 10) : 0
        result = {
            code: code,
            stdout: template.testresult,
            stderr: "",
        }
    }
    console.log("runCommand result", result)
    if (template.return_code) {
        task.setData(template.return_code, result.code)
    }
    let output = (result.stdout ?? "") + "\n\n" + (result.stderr ?? "")
    if (result.code !== 0) {
        console.log("\n\ncommand non 0 exit\n", output, "\n\n")
    }
    return output
}
