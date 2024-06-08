import { element } from "./element.js"

export async function button(text, kind, onClick, props = {}) {
    let attr = {
        ...props,
    }

    let cn = attr.class ?? ""
    if (kind) {
        cn += " " + kind
    }
    attr.class = cn
    if (onClick) {
        attr.onclick = onClick
    }
    return element("button", attr, text)
}
