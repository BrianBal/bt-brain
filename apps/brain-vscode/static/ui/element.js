import { getArgs } from "./getArgs.js"

export async function element(...args) {
    let { tag, props, children } = await getArgs(...args)
    let el = document.createElement(tag)
    for (let k in props) {
        switch (k) {
            case "class":
                el.className = props[k]
                break
            case "style":
                el.style.cssText = props[k]
                break
        }
        el[k] = props[k]
    }

    if (Array.isArray(children)) {
        for (let child of children) {
            if (typeof child === "string") {
                el.appendChild(document.createTextNode(child))
            } else if (child instanceof Node) {
                el.appendChild(child)
            } else {
                console.log("unknown child", child)
            }
        }
    } else if (children) {
        el.appendChild(children)
    }
    return el
}
