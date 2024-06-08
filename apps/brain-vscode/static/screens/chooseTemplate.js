import { templateButton, select, row, col, label } from "../ui.js"

export const chooseTemplate = (templates, models, defaultModel, setData) => {
    const allModels = models ?? []
    let selectedModel = defaultModel
    const onModelSelected = (key) => {
        let model = allModels.find((m) => m.key === key)
        console.log("onModelSelected", key, model, allModels)
        selectedModel = model
    }
    const onTemplateSelected = (template) => {
        template.model = selectedModel.key
        setData({ selectedTemplate: template, screen: "gather-data" })
    }

    let options = allModels.map((m) => ({ value: m.key, label: m.service + " " + m.model }))
    console.log("ChooseTemplate", models, defaultModel)

    return col(
        label("h1", "BRAIN: Choose a template"),
        row(
            { style: "margin-bottom: 30px" },
            col(
                { class: "formish" },
                label("label", "Select Model"),
                select("model", options, defaultModel?.key ?? options[0].value, {
                    onchange: (event) => {
                        // get the selected value of the select
                        let val = event.currentTarget.value
                        onModelSelected(val)
                    },
                })
            )
        ),
        row(
            { style: "margin-bottom: 30px" },
            ...templates
                .filter((t) => t.visible)
                .map((t) =>
                    templateButton(t, { class: "f3", onclick: () => onTemplateSelected(t) })
                )
        ),
        label(
            "p",
            "You can change or add more templates in the .brain/templates directory of your project."
        )
    )
}
