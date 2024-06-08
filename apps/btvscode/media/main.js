// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

console.log("Web Script starting")
const vscode = acquireVsCodeApi()

// Check if we have an old state to restore from
const previousState = vscode.getState() ?? {}

const postMessage = (cmd, data) => {
    console.log("web postMessage", cmd, data)
    console.log("web postMessage cmd", cmd)
    console.log("web postMessage data", data)
    vscode.postMessage({
        command: cmd,
        data: data,
    })
}

const handleMessage = (e) => {
    let message = e.data ?? {}
    console.log("web handleMessage", message)
    switch (message.command) {
        case "clear":
            clearLogs()
            break
        case "log":
            displayText(message.data)
            break
        case "choose-template":
            displayChooseTemplate(message.data)
            break
        case "gather-data":
            displayGatherData(message.data)
            break
        case "confirm-review":
            displayConfirmHumanReview(message.data)
            break
        default:
            break
    }
}

const getLogsContainer = () => {
    return document.getElementById("log")
}

const displayLoadButton = () => {
    console.log("displayLoadButton")
    let container = getLogsContainer()
    let button = document.createElement("button")
    button.textContent = "Load"
    button.addEventListener("click", () => {
        container.removeChild(button)
        let text = document.createElement("p")
        text.textContent = "Loading Templates ..."
        container.appendChild(text)
        postMessage("ready", {})
    })
    console.log("container", container)
    container.appendChild(button)
}

const displayConfirmHumanReview = (content) => {
    console.log("displayConfirmHumanReview")
    let container = getLogsContainer()

    let div = document.createElement("div")

    let heading = document.createElement("h3")
    heading.textContent = "Human Review"
    div.appendChild(heading)

    let textArea = document.createElement("textarea")
    textArea.name = "human-review"
    textArea.value = content
    textArea.style = "width: 100%; height: 50vh;"
    div.appendChild(textArea)

    let rejectButton = document.createElement("button")
    rejectButton.textContent = "Rejected"
    rejectButton.addEventListener("click", () => {
        container.removeChild(div)
        let text = document.createElement("p")
        text.textContent = "Human review rejected"
        container.appendChild(text)
        postMessage("human-review-confirmed", {
            approved: false,
            text: textArea.value,
        })
    })
    div.appendChild(rejectButton)

    let button = document.createElement("button")
    button.textContent = "Approve"
    button.addEventListener("click", () => {
        container.removeChild(div)
        let text = document.createElement("p")
        text.textContent = "Human review approved"
        container.appendChild(text)
        postMessage("human-review-confirmed", {
            approved: true,
            text: textArea.value,
        })
    })
    div.appendChild(button)
    container.appendChild(div)
    console.log("displayConfirmHumanReview done")
}

const clearLogs = () => {
    getLogsContainer().innerHTML = ""
}

const displayText = (text) => {
    getLogsContainer().innerHTML += `<p>${text}</p>`
}

const displayChooseTemplate = (templates) => {
    console.log("displayChooseTemplate", templates)
    let container = getLogsContainer()

    let form = document.createElement("form")

    let select = document.createElement("select")
    select.name = "choose-template"
    form.appendChild(select)

    for (let t of templates) {
        let option = document.createElement("option")
        option.value = t.id
        option.text = t.title
        select.appendChild(option)
    }

    let button = document.createElement("button")
    button.textContent = "Start"
    button.addEventListener("click", () => {
        let selectedTemplate = templates.find((t) => t.id === select.value)
        postMessage("selected-template", select.value)
        container.removeChild(form)

        let text = document.createElement("p")
        text.textContent = selectedTemplate.title + " Starting..."
        container.appendChild(text)
        container.scrollTop = container.scrollHeight
    })
    form.appendChild(button)

    container.appendChild(form)
    container.scrollTop = container.scrollHeight
}

const displayGatherData = (template) => {
    console.log("displayGatherData", template)
    let container = getLogsContainer()
    let heading = document.createElement("h3")
    let form = document.createElement("form")
    let button = document.createElement("button")

    // heading
    heading.innerText = template.title
    container.appendChild(heading)

    // form
    for (let v of template.vars) {
        if (v.form) {
            let p = document.createElement("p")

            let label = document.createElement("label")
            label.innerText = v.form
            p.appendChild(label)

            if (v.type === "text") {
                let input = document.createElement("textarea")
                input.name = v.name
                input.value = "ls -al ./"
                p.appendChild(input)
            }
            if (v.type === "string") {
                let input = document.createElement("input")
                input.name = v.name
                input.type = "text"
                p.appendChild(input)
            }
            if (v.type === "number") {
                let input = document.createElement("input")
                input.name = v.name
                input.type = "number"
                p.appendChild(input)
            }
            if (v.type === "file") {
                let input = document.createElement("input")
                input.name = v.name
                input.type = "file"
                p.appendChild(input)
            }

            form.appendChild(p)
        }
    }

    // button
    button.textContent = "Submit"
    button.addEventListener("click", (e) => {
        e.preventDefault()
        let fd = new FormData(form)
        var data = Object.fromEntries(fd)

        container.removeChild(form)
        for (let key of Object.keys(data)) {
            // map files to names
            let val = data[key]
            if (val instanceof File) {
                data[key] = val.path
            }
            let p = document.createElement("p")
            p.innerText = key + ": " + data[key]
            container.appendChild(p)
        }
        container.scrollTop = container.scrollHeight
        postMessage("gathered-data", data)
    })
    form.appendChild(button)

    container.appendChild(form)
    container.scrollTop = container.scrollHeight
}

/*** start things up */
window.addEventListener("message", handleMessage)
console.log("Web Script ready, displaying load button")
displayLoadButton()
