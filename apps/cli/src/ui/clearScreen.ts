export default function clearScreen(): void {
    const clearCommand = process.platform === "win32" ? "\x1B[2J\x1B[0f" : "\x1B[2J\x1B[3J\x1B[H"
    process.stdout.write(clearCommand)
}
