import * as fs from "fs/promises"
import * as redis from "redis"
import { RedisEvent } from "../RedisEvent"
import { exec } from "../util"

export class PublishConfigEvent extends RedisEvent {
    readonly client: redis.RedisClientType
    readonly config: string

    constructor(client: redis.RedisClientType, config: string) {
        super()
        this.client = client
        this.config = config
    }

    async handle() {
        await fs.writeFile("/etc/wireguard/wg0.conf", this.config, {
            mode: 0o600,
        })

        await exec("wg syncconf wg0 <(wg-quick strip wg0)")
    }
}
