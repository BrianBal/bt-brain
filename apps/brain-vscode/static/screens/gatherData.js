import { element, button, row, col, label, input } from "../ui.js"

export const gatherData = async (
    template,
    data,
    postMessage,
    setData,
    setStorageValue,
    getStorageValue
) => {
    let inputs = []
    let formData = { ...data }

    // load default values if needed
    if (!formData["_loaded"]) {
        for (let v of template.vars) {
            if (v.form) {
                let key = `${template.id}-${v.name}`
                let value = await getStorageValue(key)
                formData[v.name] = value ?? ""
            }
        }
        formData["_loaded"] = true
    }
    console.log("gatherData formData", formData)

    const onInput = (e) => {
        let name = e.target.name
        let value = e.target.value
        console.log("onInput", name, value)
        if (e.target.type === "file") {
            if (e.target.files.length > 0) {
                let file = e.target.files[0]
                value = file.path
            } else {
                value = ""
            }
        }
        let key = `${template.id}-${name}`
        setStorageValue(key, value)

        formData[name] = value
        console.log("formData", formData)
    }

    const onContinue = (e) => {
        console.log("onContinue", formData, setData, postMessage)
        setData({ screen: "running-task", templateData: formData })
        postMessage("start-task", { template, data: formData })
    }

    const onCancel = (e) => {
        setData({ screen: "choose-template", templateData: {} })
    }

    for (let v of template.vars) {
        if (v.form) {
            inputs.push(
                await element(
                    "p",
                    label("label", v.form),
                    element("br"),
                    input(v.name, v.type, formData[v.name] ?? "", { onchange: onInput })
                )
            )
        }
    }

    return col(
        label("h1", `BRAIN: ${template.title}`),
        element(
            "div",
            { class: "formish" },
            ...inputs,
            row(
                { style: "margin-top: 30px" },
                button("Cancel", "negative", onCancel),
                button("Continue", "positive", onContinue)
            )
        )
    )
}
