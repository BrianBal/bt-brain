import asyncExec from "../util/asyncExec"
import listFiles from "../util/listFiles"
import * as path from "path"
import getEmbedsDB from "../data/getEmbedsDB"
import Session from "../Session"
import * as fs from "fs"

interface Embedding {
    id: string
    content_hash: string
    update: number
}

export default async function createEmbeds(dir: string): Promise<boolean> {
    console.time("createEmbeds")
    console.time("createEmbed:Setup")
    const session = Session.get()
    const wdir = session.workspace ?? path.resolve(dir)
    const files = await listFiles(wdir)
    console.timeLog("createEmbed:Setup")
    console.log("   creating embeds in", wdir)

    console.time("createEmbed:GetEmbeds")
    let embeds: Embedding[] = []
    const embedsDB = await getEmbedsDB()
    try {
        if (embedsDB.doesDatabaseExist()) {
            const sql = "select * from collections where name = ?"
            const collection = await embedsDB.get(sql, ["code"])
            const sql2 =
                "select id, HEX(content_hash) as content_hash, updated from embeddings where collection_id = ?"
            embeds = await embedsDB.all(sql2, [collection.id])
        }
    } catch (e) {
        // error caught nothing else to do
        console.log("error", e)
    }
    console.timeLog("createEmbed:GetEmbeds")

    console.time("createEmbed:Files")
    for (const file of files) {
        const id = file.replace(`${wdir}/`, "")
        let changed = false
        let fileStat = fs.statSync(file)
        const embed = embeds.find((e) => e.id === id)
        if (!embed) {
            changed = true
        } else if (embed.update < fileStat.mtime.getTime()) {
            let hash: string | null = null
            let embedHash = ""
            if (embed) {
                hash = await fileHash(file)
                embedHash = embed.content_hash
                changed = embedHash !== hash
            }
        }

        if (changed) {
            console.log(`   🟠 ${id}`)
            let cmd = `llm embed -i "${file}" --store -d ${session.embedsDatabaseFile} code "${id}"`
            let out = await asyncExec(cmd)
            if (out.stderr) {
                console.log("embed ERR", out.stderr)
            }
        } else {
            console.log(`   🟢 ${id}`)
        }
    }
    console.timeLog("createEmbed:Files")

    console.timeLog("createEmbeds")
    return true
}

export async function createEmbedForFile(filePath: string) {
    let session = Session.get()
    let wdir = path.dirname(filePath)
    let fp = filePath
    if (!fp.startsWith(wdir)) {
        fp = path.resolve(path.join(wdir, filePath))
    }
    let id = fp.replace(`${wdir}/`, "")
    let cmd = `llm embed -i "${fp}" --store -d ${session.embedsDatabaseFile} code "${id}"`
    await asyncExec(cmd)
}

async function fileHash(path: string): Promise<string> {
    const result = await asyncExec(`md5 -q ${path}`)
    return result.stdout.trim().toUpperCase()
}
