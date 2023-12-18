import axios from "axios"
import os from "os"
import parsePrometheusTextFormat from "parse-prometheus-text-format"

export class PrivacyFirewall {
    private dnsRegex = /dns[0-9]*/
    private httpPort = 4000

    async fetchMetrics() {
        const ips = this.getPrivacyFirewallIps()

        const data = await Promise.all(
            ips.map(async (ip) => await this.computeMetrics(ip)),
        )

        return this.combineMetrics(data)
    }

    private combineMetrics(metrics: any[]) {
        return metrics.reduce((acc, curr) => {
            Object.entries<any>(curr).forEach(([key, value]) => {
                if (!acc[key]) {
                    acc[key] = {}
                }

                Object.entries(value).forEach(([key2, value2]) => {
                    if (!acc[key][key2]) {
                        acc[key][key2] = 0
                    }

                    acc[key][key2] += value2
                })
            })

            return acc
        }, {})
    }

    private async computeMetrics(ip: string): Promise<any> {
        const data = await this.fetchMetricsFromIp(ip)
        const metrics = parsePrometheusTextFormat(data) as any

        const blocked = metrics.find(
            (metric: any) => metric?.name === "blocky_query_blocked_total",
        )

        const total = metrics.find(
            (metric: any) => metric?.name === "blocky_query_total",
        )

        return {
            blocked: this.parsePrometheusMetric(blocked),
            total: this.parsePrometheusMetric(total),
        }
    }

    private parsePrometheusMetric(metric: any) {
        return (
            metric?.metrics?.reduce((acc: any, curr: any) => {
                const cnt = parseInt(curr.value)
                const ip = curr.labels.client

                if (!acc[ip]) {
                    acc[ip] = 0
                }

                acc[ip] += cnt

                return acc
            }, {}) || {}
        )
    }

    private async fetchMetricsFromIp(ip: string): Promise<any> {
        return (await axios.get(`http://${ip}:${this.httpPort}/metrics`)).data
    }

    private getPrivacyFirewallIps(): string[] {
        return Object.entries(os.networkInterfaces())
            .filter(([name]) => this.dnsRegex.test(name))
            .map(([_, data]) => data?.find((i) => i.family === "IPv4"))
            .map((i) => i?.address)
            .filter((i) => i !== undefined) as string[]
    }
}
