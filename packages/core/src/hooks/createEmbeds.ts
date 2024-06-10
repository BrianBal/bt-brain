import asyncExec from "../util/asyncExec"
import listFiles from "../util/listFiles"
import * as path from "path"
import getEmbedsDB from "../data/getEmbedsDB"
import Session from "../Session"

interface Embedding {
    id: string
    content_hash: string
}

export default async function createEmbeds(dir: string): Promise<boolean> {
    const session = Session.get()
    const wdir = session.workspace ?? path.resolve(dir)
    const files = await listFiles(wdir)
    console.log("🟢 createEmbeds", wdir)

    let embeds: Embedding[] = []
    const embedsDB = await getEmbedsDB()
    try {
        if (embedsDB.doesDatabaseExist()) {
            const sql = "select * from collections where name = ?"
            const collection = await embedsDB.get(sql, ["code"])
            const sql2 =
                "select id, HEX(content_hash) as content_hash from embeddings where collection_id = ?"
            embeds = await embedsDB.all(sql2, [collection.id])
        }
    } catch (e) {
        // error caught nothing else to do
        console.log("error", e)
    }

    for (const file of files) {
        const id = file.replace(`${wdir}/`, "")
        const embed = embeds.find((e) => e.id === id)
        let hash: string | null = null
        let embedHash = ""
        if (embed) {
            hash = await fileHash(file)
            embedHash = embed.content_hash
        }
        if (embedHash !== hash) {
            console.log(`🟠 ${id}`)
            let cmd = `llm embed -i "${file}" --store -d ${session.embedsDatabaseFile} code "${id}"`
            await asyncExec(cmd)
        } else {
            console.log(`🟢 ${id}`)
        }
    }

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
