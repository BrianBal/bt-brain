import { element } from "./element.js"
import { label } from "./label.js"

export function templateButton(template, props = {}) {
    let cn = props.class ?? ""
    return element(
        "div",
        {
            ...props,
            class: cn + " template-button",
        },
        label("h3", template.title),
        label("p", template.description)
    )
}
