import { element } from "./element.js"

export function select(name, options, defaultValue, props = {}) {
    let attr = {
        ...props,
        name: name,
        value: defaultValue,
    }

    let cn = attr.class ?? ""
    cn += " select"
    attr.class = cn

    let opts = options ?? []
    const optionElements = opts.map((option) => {
        const { value, label } = option
        let selected = value === defaultValue
        let attr = {
            value: value,
        }
        if (selected) {
            attr.selected = "selected"
        }

        return element("option", attr, label)
    })

    return element("select", attr, ...optionElements)
}
