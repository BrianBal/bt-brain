import { describe, test, expect } from "vitest"
import asyncExecute from "./asyncExec"

describe("asyncExecute", () => {
    test("should execute a command", async () => {
        const cmd = 'echo "testing 123"'
        const result = await asyncExecute(cmd)
        expect(result.stdout).toBe("testing 123\n")
    })
})
