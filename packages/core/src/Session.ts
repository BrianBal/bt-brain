import { homedir } from "node:os"
import * as path from "path"
import * as fs from "fs"
import { stringify } from "yaml"
import writeTest from "./templates/write-test.json"

export type ModelInfo = {
    key: string
    service: string
    model: string
    maxInputTokens: number
    [key: string]: any
}

/**
 * Manages the session.
 */
export default class Session {
    //// Static
    static version = "1.0.0"
    static instance: Session | null = null

    /**
     * Returns the instance of the Session class.
     *
     * @return {Session} The instance of the Session class.
     */
    static get(workspace?: string): Session {
        if (!Session.instance) {
            Session.instance = new Session(workspace)
        }
        return Session.instance
    }

    //// Instance

    globalConfigPresent = false
    _globalConfig: any = null
    sessionConfigPresent = false
    _sessionConfig: any = null
    workspace: string | undefined = undefined

    /**
     * Returns the global configuration object.
     *
     * @return {Object} The global configuration object.
     */
    get globalConfig(): any {
        return this._globalConfig
    }

    set globalConfig(config: any) {
        config.version = Session.version
        this._globalConfig = config
        this.globalConfigPresent = true
        this.saveGlobalConfig()
    }

    /**
     * Returns the session configuration object.
     *
     * @return {Object} The session configuration object.
     */
    get sessionConfig(): any {
        return this._sessionConfig
    }

    /**
     * Sets the session configuration and saves it to disk.
     *
     * @param {Object} config - The new session configuration.
     * @return {void} This function does not return anything.
     */
    set sessionConfig(config: any) {
        this._sessionConfig = config
        this.sessionConfigPresent = true
        this.saveSessionConfig()
    }

    /**
     * Initializes a new instance of the class and loads the necessary data.
     *
     * @return {void}
     */
    constructor(workspace?: string) {
        this.workspace = workspace
        if (this.workspace) {
            this.load()
        }
    }

    /**
     * Loads the global configuration, sets up the local configuration directory, and loads the session configuration.
     *
     * @return {void} This function does not return anything.
     */
    load(): void {
        this.loadGlobalConfig()
        this.setupLocalConfigDir()
        this.loadSessionConfig()
    }

    /**
     * Loads the global configuration from the specified path.
     *
     * @return {void} This function does not return anything.
     */
    loadGlobalConfig(): void {
        const homeDir = homedir()
        const configPath = path.join(homeDir, ".config", "brain", "config.json")
        try {
            if (fs.existsSync(configPath)) {
                const globalConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"))
                if (globalConfig.version === Session.version) {
                    this.globalConfig = globalConfig
                    this.globalConfigPresent = true
                }
            }
        } catch (_e: any) {
            // nothing to do
        }
    }

    /**
     * Saves the global configuration to the specified path if it is present.
     *
     * @return {void} This function does not return anything.
     */
    saveGlobalConfig(): void {
        if (this.globalConfigPresent) {
            const homeDir = homedir()
            const configDir = path.join(homeDir, ".config", "brain")
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true })
            }
            const configPath = path.join(configDir, "config.json")
            fs.writeFileSync(configPath, JSON.stringify(this.globalConfig, null, 2))
        }
    }

    loadSessionConfig(): void {
        const dir = this.localConfigDir
        const configPath = path.join(dir, "config.json")
        try {
            if (fs.existsSync(configPath)) {
                this.sessionConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"))
                this.sessionConfigPresent = true
            }
        } catch (e: any) {
            console.error("Error loading session config file:", e.message)
        }
    }

    /**
     * Saves the session configuration to a JSON file in the local configuration directory if it is present.
     *
     * @return {void} This function does not return anything.
     */
    saveSessionConfig(): void {
        if (this.sessionConfigPresent) {
            const filePath = path.join(this.localConfigDir, "config.json")
            fs.writeFileSync(filePath, JSON.stringify(this.sessionConfig, null, 2))
        }
    }

    /**
     * Sets up the local configuration directory by creating an ignore file, a config file, and a log directory if they don't exist.
     *
     * @return {void} This function does not return anything.
     */
    setupLocalConfigDir(): void {
        let hasIgnoreFile = false
        let hasConfigFile = false
        let hasLogDir = false
        let hasTemplatesDir = false

        // list files in local config dir
        let dir = this.localConfigDir
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        const listing = fs.readdirSync(dir)
        for (let file of listing) {
            if (file === "ignore") {
                hasIgnoreFile = true
            }
            if (file === "project.json") {
                hasConfigFile = true
            }
            if (file === "logs") {
                hasLogDir = true
            }
            if (file === "templates") {
                hasTemplatesDir = true
            }
        }

        // setup ignore file
        if (!hasIgnoreFile) {
            let ignore = ".brain\n"
            ignore += "node_modules\n"
            ignore += "coverage\n"
            ignore += ".vscode\n"
            ignore += ".git\n"
            ignore += "build\n"
            ignore += "dist\n"
            fs.writeFileSync(path.join(this.localConfigDir, "ignore"), ignore)
        }

        // setup config file
        if (!hasConfigFile) {
            let project = {
                version: "1.0.0",
                name: "My Project",
                language: "TypeScript",
                testFramework: "vitest",
                cmdTest: "npm test",
                cmdLint: "npm run lint",
                cmdFormat: "npm run lint",
            }
            let configPath = path.join(this.localConfigDir, "project.json")
            fs.writeFileSync(configPath, JSON.stringify(project, null, 2))
        }

        // setup log dir
        if (!hasLogDir) {
            fs.mkdirSync(path.join(this.localConfigDir, "logs"), { recursive: true })
        }

        // setup templates dir
        if (!hasTemplatesDir) {
            fs.mkdirSync(path.join(this.localConfigDir, "templates"), { recursive: true })
            let to = path.join(this.localConfigDir, "templates", "write-test.yaml")
            fs.writeFileSync(to, stringify(writeTest, null, 2))
        }
    }

    /**
     * Returns the language from the session configuration, or defaults to "TypeScript" if not present.
     *
     * @return {string} The language from the session configuration, or "TypeScript" if not present.
     */
    get language(): string {
        return this.sessionConfig?.language ?? "TypeScript"
    }

    /**
     * Returns the test framework from the session configuration, or defaults to "vitest" if not present.
     *
     * @return {string} The test framework from the session configuration, or "vitest" if not present.
     */
    get testFramework(): string {
        return this.sessionConfig?.testFramework ?? "vitest"
    }

    /**
     * Returns the test command from the session configuration, or a default message if not set.
     *
     * @return {string} The test command from the session configuration, or "echo 'No test command set'" if not set.
     */
    get cmdTest(): string {
        return this.sessionConfig?.cmdTest ?? `echo "No test command set"`
    }

    /**
     * Returns the linting command from the session configuration, or a default message if not set.
     *
     * @return {string} The linting command from the session configuration, or "echo 'No linting command set'" if not set.
     */
    get cmdLint(): string {
        return this.sessionConfig?.cmdLint ?? `echo "No linting command set"`
    }

    /**
     * Returns the formatting command from the session configuration, or a default message if not set.
     *
     * @return {string} The formatting command from the session configuration, or "echo 'No formatting command set'" if not set.
     */
    get cmdFormat(): string {
        return this.sessionConfig?.cmdFormat ?? `echo "No formatting command set"`
    }

    /**
     * Returns the path to the logs directory within the local configuration directory.
     *
     * @return {string} The path to the logs directory.
     */
    get logsDir(): string {
        return path.join(this.localConfigDir, "logs")
    }

    /**
     * Returns the path to the templates directory within the local configuration directory.
     *
     * @return {string} The path to the templates directory.
     */
    get localTemplatesDir(): string {
        return path.join(this.localConfigDir, "templates")
    }

    /**
     * Returns the path to the global templates directory.
     *
     * @return {string} The path to the global templates directory.
     */
    get globalTemplatesDir(): string {
        return path.join(this.configDir, "templates")
    }

    /**
     * Returns the path to the ignore file within the local configuration directory.
     *
     * @return {string} The path to the ignore file.
     */
    get ignoreFile(): string {
        return path.join(this.localConfigDir, "ignore")
    }

    /**
     * Returns the path to the embeds database file within the local configuration directory.
     *
     * @return {string} The path to the embeds database file.
     */
    get embedsDatabaseFile(): string {
        return path.join(this.localConfigDir, "embeds.db")
    }

    /**
     * Returns the path to the configuration directory based on the current environment.
     *
     * @return {string} The path to the configuration directory.
     */
    get configDir(): string {
        let configPath: string
        if (process.env.NODE_ENV === "test") {
            configPath = path.resolve(path.join(__dirname, "..", "..", "test-workspace", "config"))
        } else {
            const homeDir = homedir()
            configPath = path.join(homeDir, ".config", "brain")
        }
        if (fs.existsSync(configPath)) {
            fs.mkdirSync(configPath, { recursive: true })
        }
        return configPath
    }

    /**
     * Returns the path to the local configuration directory.
     *
     * @return {string} The path to the local configuration directory.
     */
    get localConfigDir(): string {
        if (this.workspace) {
            let configPath = path.join(this.workspace, ".brain")
            if (process.env.NODE_ENV === "test") {
                configPath = path.resolve(
                    path.join(__dirname, "..", "..", "test-workspace", "local-config")
                )
            }
            if (!fs.existsSync(configPath)) {
                fs.mkdirSync(configPath, { recursive: true })
            }
            return configPath
        }
        return ""
    }

    getModels(): ModelInfo[] {
        let models: ModelInfo[] = []
        for (let key of Object.keys(this.globalConfig)) {
            if (!["defaultModel", "version", "defaultSmallModel"].includes(key)) {
                let info = this.globalConfig[key]
                if (info.service && info.model) {
                    models.push({
                        key: key,
                        ...info,
                    })
                }
            }
        }
        return models
    }

    /**
     * Retrieves the model information based on the provided model key.
     *
     * @param {string} modelKey - The key of the model to retrieve.
     * @return {object|null} The model information object if found, or null if not found.
     */
    getModel(modelKey: string): any | null {
        let modelInfo: any = null
        // first try to find the model info from param
        if (modelKey) {
            let val = this.globalConfig[modelKey]
            if (typeof val === "string") {
                modelInfo = this.globalConfig[val]
            } else {
                modelInfo = this.globalConfig[modelKey]
            }
            if (typeof modelInfo !== "object") {
                modelInfo = null
            }
        }
        // second try to find the model info from default config
        if (!modelInfo && this.globalConfig.defaultModel) {
            modelInfo = this.globalConfig[this.globalConfig.defaultModel]
        }
        // third try to fallback to any model info from default config
        if (!modelInfo) {
            for (let key of Object.keys(this.globalConfig)) {
                let info = this.globalConfig[key]
                if (info.service && info.model) {
                    modelInfo = info
                    break
                }
            }
        }

        let key = null
        for (let model of this.getModels()) {
            if (model.model === modelInfo.model) {
                key = model.key
                break
            }
        }
        modelInfo.key = key

        return modelInfo
    }
}
