import os from "os"
import { Redis } from "./modules/redis.js"
import { ITrafficStats } from "./types.js"
import { exec } from "./util.js"

export class PerformanceMonitoring {
    lastStats: ITrafficStats = {}
    constructor() {}

    private parseRawStats(rawStats: string) {
        return rawStats.trim().split("\n").slice(1).map(this.parseVpnStatusLine)
    }

    private parseVpnStatusLine(line: string) {
        const [
            publicKey,
            preSharedKey,
            endpoint,
            allowedIps,
            latestHandshakeAt,
            transferRx,
            transferTx,
            persistentKeepalive,
        ] = line.split("\t")

        return {
            publicKey,
            preSharedKey,
            endpoint,
            allowedIps: allowedIps.split(","),
            latestHandshakeAt:
                latestHandshakeAt === "0"
                    ? null
                    : new Date(parseInt(latestHandshakeAt) * 1000),
            transferRx: parseInt(transferRx),
            transferTx: parseInt(transferTx),
            persistentKeepalive,
        }
    }

    startMonitoring() {
        setInterval(async () => {
            const data = await exec(["wg", "show", "wg0", "dump"])
            const redis = await Redis.getInstance()
            const hostname = os.hostname()
            const parsed = this.parseRawStats(data)

            const currentStats = await parsed.reduce((acc, vpn) => {
                acc[vpn.publicKey] = {
                    rx: vpn.transferRx,
                    tx: vpn.transferTx,
                }

                return acc
            }, {} as ITrafficStats)

            let redisResults = {} as Record<string, any>

            const connectioResults = await redis.mGet(
                parsed.map((vpn) => `vpn_connection_state:${vpn.publicKey}`),
            )
            await Promise.all(
                parsed.map(async (vpn, i) => {
                    const tx =
                        vpn.transferTx - this.lastStats[vpn.publicKey]?.tx || 0
                    const rx =
                        vpn.transferRx - this.lastStats[vpn.publicKey]?.rx || 0

                    const onlineStateCache = connectioResults[i]

                    let connectedState: boolean

                    if (onlineStateCache) {
                        connectedState = true
                    } else {
                        const lastRx =
                            this.lastStats[vpn.publicKey]?.rx || vpn.transferRx
                        const lastTx =
                            this.lastStats[vpn.publicKey]?.tx || vpn.transferTx

                        connectedState =
                            vpn.transferRx !== lastRx ||
                            vpn.transferTx !== lastTx

                        if (connectedState === true) {
                            await redis.set(
                                `vpn_connection_state:${vpn.publicKey}`,
                                "dummy",
                                {
                                    EX: 30,
                                },
                            )
                        }
                    }

                    redisResults[vpn.publicKey] = {
                        ...vpn,
                        tx,
                        rx,
                        connected: connectedState,
                    }
                }),
            )

            await redis.json.set(`vpn_stats:${hostname}`, "$", redisResults)

            //apply the latest stats
            this.lastStats = currentStats
        }, 1000)
    }
}
