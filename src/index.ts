import { Elysia } from "elysia"
import * as fs from "fs/promises"
import os from "os"
import { PingEvent } from "./events/ping.js"
import { PublishConfigEvent } from "./events/publish-config.js"
import { StartInterfaceEvent } from "./events/start-interface.js"
import { Redis } from "./modules/Redis.js"
import { exec, fileExists } from "./util.js"

const platform = os.platform()
const hostname = os.hostname()

if (!(await fileExists("/etc/wireguard")) && platform === "linux") {
    console.log("Initial created wireguard directory")
    await fs.mkdir("/etc/wireguard")
}

console.log("Connecting to redis..")
const redisClient = await Redis.getInstance()

const listener = [
    {
        alias: `ping:${os.hostname()}`,
        func: async () => {
            await new PingEvent(redisClient).handle()
        },
    },
    {
        alias: `start_interface:${os.hostname()}`,
        func: async () => {
            await new StartInterfaceEvent(redisClient).handle()
        },
    },
    {
        alias: `publish_config:${os.hostname()}`,
        func: async (data: string) => {
            await new PublishConfigEvent(redisClient, data).handle()
        },
    },
]

for (const { alias, func } of listener) {
    await redisClient.executeIsolated(async (client) => {
        console.log(`Subscribing to redis event '${alias}'`)

        await client.subscribe(alias, async (data, channel) => {
            console.debug(`Received event '${channel}' with data '${data}'`)
            await func(data)
        })
    })
}

new Elysia()
    .get("/metrics", async () => {
        return await exec(["wg", "show", "wg0", "dump"])
    })
    .listen(8080)

console.log(`Starting RadicalVON Wireguard Adapter on '${hostname}'`)
