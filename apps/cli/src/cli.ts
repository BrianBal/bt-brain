import { version } from "core"

export function run(args: any) {
    console.log("args", args)
    version()
}

run(process.argv)
