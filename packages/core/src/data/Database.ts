import { statSync } from "fs"
import asyncExec, { ExecResult } from "../util/asyncExec"

export default class Database {
    private databasePath: string

    constructor(databasePath: string) {
        this.databasePath = databasePath
    }

    doesDatabaseExist(): boolean {
        if (this.databasePath === ":memory:") {
            return true
        }
        let fileStat = statSync(this.databasePath)
        return fileStat.isFile()
    }

    private buildCommand(query: string, args: any[]): string {
        const escapedArgs = args.map((arg) =>
            typeof arg === "string" ? `'${arg.replace(/'/g, "''")}'` : arg
        )
        const replacedQuery = query.replace(/\?/g, () => escapedArgs.shift())
        return `sqlite3 ${this.databasePath} '.headers on' '.mode json' "${replacedQuery}"`
    }

    async run(query: string, args: any[] = []): Promise<ExecResult> {
        const command = this.buildCommand(query, args)
        let result = await asyncExec(command)
        console.log("Database.run", command, result)
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
            throw new Error(`Error parsing query result: ${result.stdout}`)
            json = []
        }

        return json
    }

    async get(query: string, args: any[] = []): Promise<any> {
        const rows = await this.all(query, args)
        return rows[0] || null
    }

    async exec(query: string, args: any[] = []): Promise<void> {
        const result = await this.run(query, args)
        if (result.code !== 0) {
            throw new Error(`Error executing query: ${result.stderr}`)
        }
    }
}