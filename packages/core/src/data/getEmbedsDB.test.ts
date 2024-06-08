import { describe, it, expect } from "vitest"
import Database from "./Database"
import getEmbedsDB from "./getEmbedsDB"
import { beforeEach } from "vitest"

describe("getEmbedsDB", () => {
    let db: Database | null = null
    beforeEach(async () => {
        db = await getEmbedsDB()
    })

    it("should successfully connect to the database", async () => {
        expect(db).toBeDefined()
    })
})
