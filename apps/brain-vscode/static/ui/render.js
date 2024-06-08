export function render(current, next) {
    // Base case: if both nodes are null, return
    if (current === null && next === null) {
        return
    }

    // If the current node is null, create a new node based on the next node
    if (current === null) {
        current = document.createElement(next.tagName)
    }

    // If the next node is null, remove the current node from its parent
    if (next === null) {
        current.parentNode.removeChild(current)
        return
    }

    // Update the current node's attributes if they have changed
    const currentAttributes = current.attributes
    const nextAttributes = next.attributes
    for (let i = 0; i < nextAttributes.length; i++) {
        const { name, value } = nextAttributes[i]
        if (currentAttributes[name] !== value) {
            current.setAttribute(name, value)
        }
    }

    // Remove attributes from the current node that are not present in the next node
    for (let i = currentAttributes.length - 1; i >= 0; i--) {
        const { name } = currentAttributes[i]
        if (!next.hasAttribute(name)) {
            current.removeAttribute(name)
        }
    }

    // Update the current node's text content if it has changed
    if (current.nodeType === Node.TEXT_NODE && current.textContent !== next.textContent) {
        current.textContent = next.textContent
    }

    // Recursively update child nodes
    const currentChildren = current.childNodes
    const nextChildren = next.childNodes
    const maxLength = Math.max(currentChildren.length, nextChildren.length)
    for (let i = 0; i < maxLength; i++) {
        render(currentChildren[i], nextChildren[i])
    }
}
