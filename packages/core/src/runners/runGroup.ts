import { AiTemplate } from "../AiTemplate"
import AiTask from "../AiTask"

export default async function runGroup(template: AiTemplate): Promise<AiTemplate[]> {
    let allTemplates = await AiTask.allTemplates()
    let templates = []
    for (let { id } of template.tasks!) {
        let subTemp = allTemplates.find((template) => template.id === id)
        if (subTemp) {
            templates.push(subTemp)
        } else {
            throw `Template not found: ${id}`
        }
    }
    return templates
}
