export type TerminalSize = {
    rows: number
    cols: number
}

export default function getTerminalSize(): TerminalSize {
    const stdout = process.stdout
    const [cols, rows] = stdout.getWindowSize() || [80, 25]
    return { rows, cols }
}
