import Database from "./Database"
import Session from "../Session"

/**
 * Retrieves the embeds database connection.
 *
 * @return {Promise<Database>} The database connection.
 * @throws {Error} If there is an error opening the database.
 */
export default async function getEmbedsDB(): Promise<Database> {
    let session = Session.get()
    try {
        let filename = session.embedsDatabaseFile
        if (process.env.NODE_ENV === "test") {
            filename = ":memory:"
        }
        const db = new Database(filename)
        return db
    } catch (error: any) {
        console.error(`Error opening embeds database: ${error.message}`)
        throw error
    }
}
