import { Job, Worker } from "bullmq"
import os from "os"
import { ConfigPublishEvent } from "./types.js"
import { exec } from "./util.js"

export class PublishQueue {
    private async processJob(job: Job<ConfigPublishEvent>) {
        console.log(`Publishing config for ${job.name} - ${job.id}`)

        await Bun.write("/etc/wireguard/wg0.conf", job.data.config)
        await exec(["wg", "syncconf", "wg0", "/etc/wireguard/wg0.conf"])
    }

    async startWorker() {
        const hostname = os.hostname()
        const url = new URL(process.env.REDIS_URL!)

        const worker = new Worker(hostname, this.processJob, {
            prefix: "vpn:publish",
            connection: {
                host: url.hostname,
                port: parseInt(url.port || "6379"),
            },
        })

        process.on("SIGINT", async () => {
            console.log("Closing publish queue worker..")
            await worker.close()
            process.exit(0)
        })
    }
}
