import * as fs from "fs/promises"

export async function exec(cmd: string[]): Promise<string> {
    const proc = Bun.spawn(cmd)
    return await new Response(proc.stdout).text()
}

export async function fileExists(path: string) {
    return !!(await fs.stat(path).catch((e) => false))
}

export async function initWireguardInterface() {
    await exec(["ip", "link", "delete", "dev", "wg0"])

    await exec(["ip", "link", "add", "dev", "wg0", "type", "wireguard"])
    await exec(["ip", "address", "add", "dev", "wg0", "10.0.0.1/16"])
    await exec(["ip", "address", "add", "dev", "wg0", "fd8f:a1fb:a69e::1/112"])
    await exec(["wg", "setconf", "wg0", "/etc/wireguard/wg0.conf"])
    await exec(["ip", "link", "set", "up", "dev", "wg0"])
}
