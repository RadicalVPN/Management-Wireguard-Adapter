import * as fs from "fs/promises"
import os from "os"
import { PingEvent } from "./events/ping.js"
import { Redis } from "./modules/redis.js"
import { PerformanceMonitoring } from "./performance-monitoring.js"
import { PublishQueue } from "./publish-queue.js"
import { fileExists, initWireguardInterface } from "./util.js"

const platform = os.platform()
const hostname = os.hostname()

if (!(await fileExists("/etc/wireguard")) && platform === "linux") {
    console.log("Initial created wireguard directory")
    await fs.mkdir("/etc/wireguard")
}

await initWireguardInterface()

console.log("Connecting to redis..")
const redisClient = await Redis.getInstance()

const listener = [
    {
        alias: `ping:${os.hostname()}`,
        func: async () => {
            await new PingEvent(redisClient).handle()
        },
    },
]

for (const { alias, func } of listener) {
    await redisClient.executeIsolated(async (client) => {
        console.log(`Subscribing to redis event '${alias}'`)

        await client.subscribe(alias, async (data, channel) => {
            console.debug(`Received event '${channel}'`)
            await func()
        })
    })
}

new PerformanceMonitoring().startMonitoring()
await new PublishQueue().startWorker()

console.log(`Starting RadicalVON Wireguard Adapter on '${hostname}'`)
