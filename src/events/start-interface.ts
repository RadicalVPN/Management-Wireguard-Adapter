import * as redis from "redis"
import { RedisEvent } from "../redis-event.js"
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
