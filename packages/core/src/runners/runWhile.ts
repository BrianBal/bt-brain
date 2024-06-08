import { AiTemplate } from "../AiTemplate"
import AiTask from "../AiTask"
import type { AiTaskBeforeTemplateFn, AiTaskAfterTemplateFn } from "../AiTask"

export default async function runWhile(
    template: AiTemplate,
    task: AiTask,
    before: AiTaskBeforeTemplateFn,
    after: AiTaskAfterTemplateFn
): Promise<void> {
    if (template.while) {
        let w = template.while!
        let until = w.until_value
        let value = task.getData(w.key)
        while (until != value) {
            let group: AiTemplate = {
                ...template,
                type: "group",
            }
            await task.processTemplates(group, before, after)
            value = task.getData(w.key)
        }
    }
}
