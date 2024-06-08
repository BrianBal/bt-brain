import { exec, ExecException } from "child_process"
import Session from "../Session"

export interface ExecResult {
    code: number | undefined
    stdout: string
    stderr: string
}

export default function asyncExec(command: string): Promise<ExecResult> {
    let session = Session.get()
    return new Promise<ExecResult>((resolve) => {
        exec(command, { cwd: session.workspace }, (error, stdout, stderr) => {
            // get the return status code
            let code: number | undefined = error ? (error as ExecException).code : 0
            resolve({ code, stdout, stderr })
        })
    })
}
