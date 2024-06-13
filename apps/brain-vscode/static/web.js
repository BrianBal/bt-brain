const vscode = acquireVsCodeApi()
import { label } from "./ui.js"
import { chooseTemplate } from "./screens/chooseTemplate.js"
import { gatherData } from "./screens/gatherData.js"
import { runningTask } from "./screens/runningTask.js"
import { humanReview } from "./screens/humanReview.js"

let main = document.getElementById("main")

let data = {
    screen: "choose-template",
    vscode_active_file: null,
    templates: [],
    models: [],
    defaultModel: null,
    selectedTemplate: null,
    templateData: {},
    log: [
        // "🔍 Exploring project",
        // "✅ Explored project",
        // "📦 Making plans",
        // "✅ Making plans",
        // "💾 Writing code",
    ],
    humanReview: {
        title: "Something to review",
        text: "This is the text to review",
    },
}
const setData = (value) => {
    data = {
        ...data,
        ...value,
    }
    console.log("setData", data)
    app(data).then((el) => {
        console.log("setData", "app", el)
        main.replaceChildren(el)
    })
}

function setStorageValue(key, value) {
    console.log("setStorageValue", key, value)
    postMessage("kv-set", { key: key, value: value })
}

async function getStorageValue(key) {
    console.log("getStorageValue", key)
    return new Promise((resolve, reject) => {
        const cb = (data) => {
            console.log("getStorageValue cb", data)
            resolve(data.value)
        }
        let callbacks = handleMessageCallbacks[key] ?? []
        callbacks.push(cb)
        handleMessageCallbacks[key] = callbacks
        postMessage("kv-get", { key: key })
    })
}

const postMessage = (cmd, data) => {
    console.log("web postMessage", cmd, data)
    console.log("web postMessage cmd", cmd)
    console.log("web postMessage data", data)
    vscode.postMessage({
        command: cmd,
        data: data,
    })
}

const handleKVGetMessage = (kvp) => {
    let callbacks = handleMessageCallbacks
    for (const key in handleMessageCallbacks) {
        if (kvp.key === key) {
            callbacks = handleMessageCallbacks[key]
        }
    }

    if (Array.isArray(callbacks)) {
        for (const cb of callbacks) {
            cb(kvp)
        }
    }
    handleMessageCallbacks[kvp.key] = []
}

const handleMessageCallbacks = {}
const handleMessage = (e) => {
    let message = e.data ?? {}
    console.log("web handleMessage", message)
    switch (message.command) {
        case "kv-get":
            handleKVGetMessage(message.data)
            break
        case "log":
            setData({ log: [...data.log, message.data] })
            break
        case "templates":
            setData({
                templates: message.data,
            })
            break
        case "models":
            setData({
                models: message.data.models,
                defaultModel: message.data.defaultModel,
            })
            break
        case "vscode-active-file":
            console.log("vscode-active-file", message.data)
            setData({ vscode_active_file: message.data })
            break
        case "human-review":
            setData({ screen: "human-review", humanReview: message.data })
            break
        default:
            break
    }
}

const app = async (data) => {
    console.log("app", data)
    switch (data.screen) {
        case "choose-template":
            return chooseTemplate(
                data.templates,
                data.vscode_active_file,
                data.models,
                data.defaultModel,
                setData
            )
            break
        case "gather-data":
            return gatherData(
                data.selectedTemplate,
                data.templateData,
                postMessage,
                setData,
                setStorageValue,
                getStorageValue
            )
            break
        case "running-task":
            return runningTask(data.selectedTemplate, data.log)
            break
        case "human-review":
            return humanReview(data.selectedTemplate, data.humanReview, postMessage, setData)
            break
        default:
            return label("h1", "loading..")
            break
    }
}

// boot
async function boot() {
    window.addEventListener("message", handleMessage)
    main.appendChild(await app(data))
}
boot()
