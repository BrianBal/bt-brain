import { element, row, col, label, input } from "../ui.js"

export const humanReview = (template, review, postMessage, setData) => {
    let text = review.text

    const onInput = (e) => {
        let name = e.target.name
        let value = e.target.value
        console.log("onInput", name, value)
        text = value
        setData({ humanReview: { title: "", text: value } })
    }

    const onApprove = (e) => {
        console.log("onApprove", "text", text, "review", review)
        postMessage("human-review-confirmed", { approved: true, text: text })
        setData({ screen: "running-task" })
    }

    const onReject = (e) => {
        postMessage("human-review-confirmed", { approved: false, text: review.text })
        setData({ screen: "running-task" })
    }

    return col(
        label("h1", `BRAIN: ${template.title}`),
        label("h3", `Human Review: ${review.title}`),
        element(
            "div",
            { class: "formish" },
            input("text", "text", review.text, { onchange: onInput, style: "min-height: 80vh" }),
            row(
                element("button", { onclick: onReject, class: "negative" }, "Reject"),
                element("button", { onclick: onApprove, class: "positive" }, "Approve")
            )
        )
    )
}
