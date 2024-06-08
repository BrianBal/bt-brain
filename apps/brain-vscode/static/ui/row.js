import { getArgs } from "./getArgs.js"
import { element } from "./element.js"

export async function row(...args) {
    let { props, children } = await getArgs(...args)
    let attr = {
        ...props,
    }
    let cn = attr.class ?? ""
    cn += " row"
    attr.class = cn

    return element("div", attr, ...children)
}
