import { element } from "./element.js"

export async function input(name, type, value, props = {}) {
    let attr = {
        ...props,
    }

    let cn = attr.class ?? ""
    cn += " input"
    attr.class = cn
    attr.value = value
    attr.name = name
    if (type === "text") {
        return element("textarea", attr)
    }
    attr.type = type
    return element("input", attr, value)
}
