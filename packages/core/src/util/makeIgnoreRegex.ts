/**
 * Creates a regular expression object based on the provided pattern.
 *
 * @param {string} pattern - The pattern to convert into a regular expression.
 * @return {RegExp} A regular expression object based on the input pattern.
 */
export default function makeIgnoreRegex(pattern: string): RegExp {
    let pat = pattern

    // remove leading slashes
    while (pat.startsWith("/")) {
        pat = pat.slice(1)
    }

    // remove trailing slashes
    while (pat.endsWith("/")) {
        pat = pat.slice(0, -1)
    }

    pat = pat.replace("/", "\\/")
    pat = pat.replace(".", "\\.")
    pat = pat.replace("*", ".*")

    try {
        const reg = new RegExp(`${pat}`, "i")
        return reg
    } catch (error) {
        console.log("makeIgnoreRegex error", error)
    }
    return new RegExp(`.DS_Store`, "i")
}
