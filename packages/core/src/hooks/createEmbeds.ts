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
    const wdir = path.resolve(dir)
    const files = await listFiles(wdir)
    console.log("🟢 createEmbeds", wdir, files)

    let embeds: Embedding[] = []
    const embedsDB = await getEmbedsDB()
    try {
        if (embedsDB.doesDatabaseExist()) {
            console.log("embedsDB", "exists")
            const sql = "select * from collections where name = ?"
            const collection = await embedsDB.get(sql, ["code"])
            console.log("collection", collection)
            const sql2 =
                "select id, HEX(content_hash) as content_hash from embeddings where collection_id = ?"
            embeds = await embedsDB.all(sql2, [collection.id])
            console.log("embeds1", embeds)
        }
    } catch (e) {
        // error caught nothing else to do
        console.log("error", e)
    }
    console.log("embeds2", embeds)

    for (const file of files) {
        const id = file.replace(`${wdir}/`, "")
        const embed = embeds.find((e) => e.id === id)
        let hash: string | null = null
        let embedHash = ""
        if (embed) {
            hash = await fileHash(file)
            embedHash = embed.content_hash
        }
        console.log("id", file, id, hash, embedHash)
        if (embedHash !== hash) {
            console.log(`🟠 ${id}`)
            let cmd = `llm embed -i "${file}" --store -d ${session.embedsDatabaseFile} code "${id}"`
            let res = await asyncExec(cmd)
            console.log("embed cmd", cmd, res)
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
    let res = await asyncExec(cmd)
    console.log("embed cmd", cmd, res)
}

async function fileHash(path: string): Promise<string> {
    const result = await asyncExec(`md5 -q ${path}`)
    return result.stdout.trim().toUpperCase()
}
