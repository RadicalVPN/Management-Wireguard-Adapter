import * as fs from "fs/promises"
import os from "os"
import { PingEvent } from "./events/ping"
import { PublishConfigEvent } from "./events/publish-config"
import { StartInterfaceEvent } from "./events/start-interface"
import { StatsEvent } from "./events/stats"
import { Redis } from "./modules/Redis"
import { fileExists } from "./util"
;(async () => {
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
            func: async (data: string) => {
                await new PingEvent(redisClient).handle()
            },
        },
        {
            alias: `start_interface:${os.hostname()}`,
            func: async (data: string) => {
                await new StartInterfaceEvent(redisClient).handle()
            },
        },
        {
            alias: `publish_config:${os.hostname()}`,
            func: async (data: string) => {
                await new PublishConfigEvent(redisClient, data).handle()
            },
        },
        {
            alias: `stats:${os.hostname()}`,
            func: async (data: string) => {
                await new StatsEvent(redisClient).handle()
            },
        },
    ]

    for (const { alias, func } of listener) {
        await redisClient.executeIsolated(async (client) => {
            console.log(`Subscribing to redis event '${alias}'`)

            await client.subscribe(alias, async (data) => {
                await func(data)
            })
        })
    }

    console.log(`Starting RadicalVON Wireguard Adapter on '${hostname}'`)
})()
