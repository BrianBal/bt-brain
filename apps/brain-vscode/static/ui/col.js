import { getArgs } from "./getArgs.js"
import { element } from "./element.js"

export async function col(...args) {
    let { props, children } = await getArgs(...args)
    let attr = {
        ...props,
    }
    let cn = attr.class ?? ""
    cn += " col"
    attr.class = cn
    return element("div", attr, ...children)
}
