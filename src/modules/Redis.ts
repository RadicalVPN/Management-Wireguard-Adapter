import * as redis from "redis"

export class Redis {
    private static clients: Map<string, redis.RedisClientType> = new Map()

    static async getInstance(alias: string = "default") {
        const existingClient = Redis.clients.get(alias)
        if (existingClient) {
            return existingClient
        }

        const url = process.env.REDIS_URL
        if (!url) {
            throw new Error("missing REDIS_URL env variable")
        }

        const newClient = redis
            .createClient({
                url,
                isolationPoolOptions: {
                    min: 5,
                    max: 50,
                },
                socket: {
                    reconnectStrategy: 1000,
                },
            })
            .on("error", (err) =>
                console.error(
                    "failed to connect to redis server:",
                    err.toString(),
                ),
            ) as redis.RedisClientType

        Redis.clients.set(alias, newClient)
        await newClient.connect()

        console.log(`connected to redis server: ${alias}`)

        return newClient
    }
}
