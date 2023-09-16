import * as redis from "redis"
import { RedisEvent } from "../RedisEvent"
import { exec } from "../util"

export class StartInterfaceEvent extends RedisEvent {
    readonly client: redis.RedisClientType

    constructor(client: redis.RedisClientType) {
        super()
        this.client = client
    }

    async handle() {
        await exec("wg-quick up wg0")
    }
}
