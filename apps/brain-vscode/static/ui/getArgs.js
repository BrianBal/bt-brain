export async function getArgs(...args) {
    let tag = undefined
    let props = undefined
    let children = []

    // some args may be unresolved promises
    let resolvedArgs = await Promise.all(args)

    for (let i = 0; i < resolvedArgs.length; i++) {
        let arg = resolvedArgs[i]

        if (typeof arg === "string" && i === 0) {
            tag = arg
        } else if (arg instanceof Node) {
            children.push(arg)
        } else if (!props && typeof arg === "object") {
            props = arg
        } else {
            children.push(arg)
        }
    }

    return { tag, props, children }
}
