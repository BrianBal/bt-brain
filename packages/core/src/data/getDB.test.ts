import { describe, it, expect } from "vitest"
import Database from "./Database"
import getDB from "./getDB.js"
import { beforeEach } from "vitest"

describe("getDB", () => {
    let db: Database | null = null
    beforeEach(async () => {
        db = await getDB()
    })

    it("should successfully connect to the database", async () => {
        expect(db).toBeDefined()
    })

    it("should create tables if they do not exist", async () => {
        const tables = await db!.all('SELECT name FROM sqlite_master WHERE type = "table"')
        expect(tables).toHaveLength(1)
        expect(tables[0].name).toBe("keyed_values")
    })
})
