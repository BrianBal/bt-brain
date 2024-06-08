import { element } from "./element.js"

export function label(type, text, props = {}) {
    let attr = {
        ...props,
    }
    let cn = attr.class ?? ""
    cn += " label"
    attr.class = cn
    return element(type, attr, text)
}
