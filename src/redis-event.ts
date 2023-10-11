import * as redis from "redis"

export abstract class RedisEvent {
    protected abstract handle(resp: redis.RedisClientType): Promise<void>
}
