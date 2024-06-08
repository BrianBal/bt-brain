import { AiTemplate } from "../AiTemplate"
import AiTask from "../AiTask"
import type { AiTaskBeforeTemplateFn, AiTaskAfterTemplateFn } from "../AiTask"

export default async function runLoop(
    template: AiTemplate,
    task: AiTask,
    before: AiTaskBeforeTemplateFn,
    after: AiTaskAfterTemplateFn
): Promise<void> {
    if (!template.loop) {
        return
    }

    let loop = template.loop
    let loopItems: any[] = ["NOTHING"]
    if (loop) {
        loopItems = task.getData(loop.items_key)
    }
    for (let loopItem of loopItems) {
        if (loop!.item_key) {
            task.setData(loop!.item_key, loopItem, loop!.data_type)
        }
        if (loop) {
            if (loop.vars) {
                for (let v of loop.vars) {
                    let vv = v as any
                    let value = loopItem[vv.key]
                    task.setData(v.name, value, v.dataType, v.format)
                }
            }

            let loopGroup: AiTemplate = {
                ...template,
                type: "group",
            }
            await task.processTemplates(loopGroup, before, after)
        }
    }
}
