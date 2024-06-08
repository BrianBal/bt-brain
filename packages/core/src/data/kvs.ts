import getDB from "./getDB"

export async function getValue(key: string): Promise<any | null> {
    const db = await getDB()
    const query = `SELECT * FROM keyed_values WHERE key = ?`
    const result = await db.get(query, [key])
    if (!result) return null

    let value: any
    switch (result.type) {
        case "string":
            value = result.value
            break
        case "number":
            value = parseInt(result.value, 10)
            break
        case "boolean":
            value = result.value === "true"
            break
        default:
            value = JSON.parse(result.value)
    }

    return value
}

export async function setValue(key: string, value: any): Promise<void> {
    console.log("setValue", key, value)
    const db = await getDB()
    let type: string
    let stringValue: string

    if (typeof value === "string") {
        type = "string"
        stringValue = value
    } else if (typeof value === "number") {
        type = "number"
        stringValue = value.toString()
    } else if (typeof value === "boolean") {
        type = "boolean"
        stringValue = value.toString()
    } else {
        type = "json"
        stringValue = JSON.stringify(value)
    }

    const query = `INSERT OR REPLACE INTO keyed_values (key, value, type) VALUES (?, ?, ?)`
    await db.run(query, [key, stringValue, type])
}
