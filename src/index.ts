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

    const publisher = await Redis.getInstance("pub")
    const subscriber = await Redis.getInstance("sub")

    console.log("Subscribing to redis events..")

    const listener = [
        {
            alias: "ping",
            func: async (data: string) => {
                await new PingEvent(publisher).handle()
            },
        },
        {
            alias: `start_interface:${os.hostname()}`,
            func: async (data: string) => {
                await new StartInterfaceEvent(publisher).handle()
            },
        },
        {
            alias: `publish_config:${os.hostname()}`,
            func: async (data: string) => {
                await new PublishConfigEvent(publisher, data).handle()
            },
        },
        {
            alias: `stats:${os.hostname()}`,
            func: async (data: string) => {
                await new StatsEvent(publisher).handle()
            },
        },
    ]

    listener.forEach(({ alias, func }) => {
        console.log(`Subscribing to redis event '${alias}'`)
        subscriber.on(alias, func)
    })

    console.log(`Starting RadicalVON Wireguard Adapter on '${hostname}'`)
})()
