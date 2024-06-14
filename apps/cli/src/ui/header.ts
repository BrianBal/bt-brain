import getTerminalSize from "./getTerminalSize"

export default function header(title: string) {
    // get the height and widht of the terminal
    const { cols } = getTerminalSize()
    let padCount = Math.round((cols - title.length) / 2)
    let pad = " ".repeat(padCount)

    console.log(" ")
    console.log("-".repeat(cols))
    console.log(pad, title)
    console.log("-".repeat(cols))
    console.log(" ")
}
