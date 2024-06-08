import * as path from "path"
import Session from "../Session"
import Database from "./Database"

let globalDB: Database | null = null

/**
 * Retrieves the database connection.
 *
 * @return {Promise<Database>} The database connection.
 * @throws {Error} If there is an error opening the database.
 */
export default async function getDB(): Promise<Database> {
    if (globalDB) {
        return globalDB
    }
    try {
        let session: Session = Session.get()
        let filename = path.join(session.configDir, "dump.db")
        if (process.env.NODE_ENV === "test") {
            filename = ":memory:"
        }
        const db: Database = new Database(filename)

        await db.exec(`
        CREATE TABLE IF NOT EXISTS keyed_values (
            key varchar PRIMARY KEY,
            value text,
            type varchar NOT NULL DEFAULT 'string'
        );`)

        globalDB = db
        return db
    } catch (error: any) {
        console.error(`Error opening database: ${error.message}`)
        throw error
    }
}
