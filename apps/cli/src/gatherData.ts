import { input } from "@inquirer/prompts"
import editor from "@inquirer/editor"
import { AiTemplate, getValue, setValue } from "core"
import inquirer from "inquirer"
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt"

export default async function gatherData(template: AiTemplate) {
    let data: { [key: string]: any } = {}
    inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection as any)

    for (let inputVar of template.vars ?? []) {
        let key = `${template.id}-${inputVar.name}`
        let def = (await getValue(key)) ?? ""
        let value = data[inputVar.name]
        if (!value && inputVar.form) {
            switch (inputVar.type) {
                case "text":
                    value = await editor({
                        message: inputVar.form!,
                        default: def,
                    })
                    break
                case "file":
                    let values = await inquirer.prompt({
                        root: process.cwd(),
                        enableGoUpperDirectory: true,
                        name: "file",
                        message: inputVar.form!,
                        type: "file-tree-selection",
                    } as any)
                    value = values.file
                    console.log("******************* value", value)
                    break
                case "string":
                    value = await input({
                        message: inputVar.form!,
                        default: def,
                    })
                    break
            }
            data[inputVar.name] = value
            await setValue(key, value)
        }
    }

    return data
}
