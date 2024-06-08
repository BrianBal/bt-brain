import { col, label } from "../ui.js"

export const runningTask = (template, logs) => {
    let entries = []

    for (let l of logs) {
        entries.push(label("p", l))
    }

    return col(
        label("h1", `BRAIN: ${template.title}`),
        label("h3", `Proccessing`),
        label("h4", `Leave this page open, grab some coffee and watch the magic happen.`),
        ...entries
    )
}
