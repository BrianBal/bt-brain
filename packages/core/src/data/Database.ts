import { existsSync } from "fs"
import asyncExec, { ExecResult } from "../util/asyncExec"

export default class Database {
    private databasePath: string
    private locked: boolean = false

    constructor(databasePath: string) {
        this.databasePath = databasePath
    }

    doesDatabaseExist(): boolean {
        if (this.databasePath === ":memory:") {
            return true
        }
        return existsSync(this.databasePath)
    }

    private buildCommand(query: string, args: any[]): string {
        const escapedArgs = args.map((arg) =>
            typeof arg === "string" ? `'${arg.replace(/'/g, "''")}'` : arg
        )
        const replacedQuery = query.replace(/\?/g, () => escapedArgs.shift())
        return `sqlite3 ${this.databasePath} '.headers on' '.mode json' "${replacedQuery}"`
    }

    async run(query: string, args: any[] = []): Promise<ExecResult> {
        if (this.locked) {
            const startTime = Date.now()
            while (this.locked) {
                if (Date.now() - startTime > 30000) {
                    throw new Error("Database lock wait time exceeded 30 seconds")
                }
                await new Promise((resolve) => setTimeout(resolve, 100))
            }
        }
        this.locked = true
        let result: ExecResult = { code: 99, stdout: "", stderr: "unkown error" }
        try {
            const command = this.buildCommand(query, args)
            result = await asyncExec(command)
        } finally {
            this.locked = false
        }
        return result
    }

    async all(query: string, args: any[] = []): Promise<any[]> {
        const result = await this.run(query, args)
        if (result.code !== 0) {
            throw new Error(`Error executing query: ${result.stderr}`)
        }
        let json: any = null
        try {
            json = JSON.parse(result.stdout)
        } catch (e) {
            json = []
        }

        return json
    }

    async get(query: string, args: any[] = []): Promise<any> {
        const rows = await this.all(query, args)
        return rows.length > 0 ? rows[0] : null
    }

    async exec(query: string, args: any[] = []): Promise<void> {
        const result = await this.run(query, args)
        if (result.code !== 0) {
            throw new Error(`Error executing query: ${result.stderr}`)
        }
    }
}
