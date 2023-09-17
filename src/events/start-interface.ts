import * as redis from "redis"
import { RedisEvent } from "../RedisEvent.js"
import { exec } from "../util.js"

export class StartInterfaceEvent extends RedisEvent {
    readonly client: redis.RedisClientType

    constructor(client: redis.RedisClientType) {
        super()
        this.client = client
    }

    async handle() {
        await exec(["wg-quick", "up", "wg0"])
    }
}
