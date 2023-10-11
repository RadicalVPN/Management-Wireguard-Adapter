import * as os from "os"
import * as redis from "redis"
import { RedisEvent } from "../redis-event.js"

export class PingEvent extends RedisEvent {
    readonly client: redis.RedisClientType

    constructor(client: redis.RedisClientType) {
        super()
        this.client = client
    }

    async handle() {
        await this.client.publish(`pong:${os.hostname()}`, "")
    }
}
