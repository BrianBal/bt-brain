import fs from "fs"
import { parse } from "yaml"
import { AiTemplate } from "./AiTemplate"
import Session from "./Session"

export default async function loadAllTemplates(): Promise<Array<AiTemplate>> {
    let session = Session.get()
    let localTemplatesDir = session.localTemplatesDir
    let globalTemplatesDir = session.globalTemplatesDir
    let a = await loadTemplates(localTemplatesDir)
    let b = await loadTemplates(globalTemplatesDir)
    return a.concat(b)
}

/**
 * Loads and parses YAML templates from the "templates" directory.
 *
 * @return {Promise<Array>} An array of parsed templates.
 */
export async function loadTemplates(dir: string | null = null): Promise<Array<AiTemplate>> {
    let templates = []

    if (!dir) {
        dir = Session.get().localTemplatesDir
    }
    console.log("loadTemplates local", dir)
    let listing = fs.readdirSync(dir)

    // list files in templates directory
    let files = listing.filter((file) => file.endsWith(".yaml")).map((f) => `${dir}/${f}`)

    // list directories in templates directory
    let dirs = listing
        .filter((f) => fs.statSync(`${dir}/${f}`).isDirectory())
        .map((d) => `${dir}/${d}`)

    // load and parse yaml files from templates directory
    for (let file of files) {
        try {
            let text = fs.readFileSync(file, "utf8")
            let json = parse(text)
            let template: AiTemplate = {
                id: json.id ?? "",
                type: json.type ?? "noop",
                filename: file,
            }
            let testresultFile = file.replace(".yaml", ".testresult.txt")
            if (fs.existsSync(testresultFile)) {
                template.testresult = fs.readFileSync(testresultFile, "utf8")
            }
            if (json.title) {
                template.title = json.title
            }
            if (json.description) {
                template.description = json.description
            }
            if (json.wait_message) {
                template.wait_message = json.wait_message
            }
            if (json.human_review) {
                template.human_review = json.human_review
            }
            if (json.visible) {
                template.visible = json.visible
            }
            if (json.model) {
                template.model = json.model
            }
            if (json.response) {
                template.response = json.response
            }
            if (json.vars) {
                template.vars = json.vars
            }
            if (json.system) {
                template.system = json.system
            }
            if (json.template) {
                template.template = json.template
            }
            if (json.command) {
                template.command = json.command
            }
            if (json.return_code) {
                template.return_code = json.return_code
            }
            if (json.loop) {
                template.loop = json.loop
            }
            if (json.while) {
                template.while = json.while
            }
            if (json.tasks) {
                template.tasks = json.tasks
            }
            templates.push(template)
        } catch (e) {
            console.log(e)
        }
    }
    for (let d of dirs) {
        templates = templates.concat(await loadTemplates(d))
    }

    return templates
}
