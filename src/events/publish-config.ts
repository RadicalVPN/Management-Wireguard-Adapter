import * as redis from "redis"
import { RedisEvent } from "../RedisEvent.js"
import { exec } from "../util.js"

export class PublishConfigEvent extends RedisEvent {
    readonly client: redis.RedisClientType
    readonly config: string

    constructor(client: redis.RedisClientType, config: string) {
        super()
        this.client = client
        this.config = config
    }

    async handle() {
        await exec(["wg", "syncconf", "wg0", "/etc/wireguard/wg0.conf"])
    }
}
