import * as os from "os"
import * as redis from "redis"
import { RedisEvent } from "../RedisEvent"
import { exec } from "../util"

export class StatsEvent extends RedisEvent {
    readonly client: redis.RedisClientType

    constructor(client: redis.RedisClientType) {
        super()
        this.client = client
    }

    async handle() {
        await this.client.publish(
            `stats:${os.hostname()}`,
            await exec("wg show wg0 dump"),
        )
    }
}
