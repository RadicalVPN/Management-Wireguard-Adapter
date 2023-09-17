import * as fs from "fs/promises"

export async function exec(cmd: string[]): Promise<string> {
    const proc = Bun.spawn(cmd)
    return await new Response(proc.stdout).text()
}

export async function fileExists(path: string) {
    return !!(await fs.stat(path).catch((e) => false))
}
