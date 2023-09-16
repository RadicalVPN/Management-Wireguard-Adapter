export default [
    {
        alias: "ping",
        func: async (data: string) => {
            await new PingEvent(publisher).handle()
        },
    },
    {
        alias: `start_interface:${os.hostname()}`,
        func: async (data: string) => {
            await new StartInterfaceEvent(publisher).handle()
        },
    },
    {
        alias: `publish_config:${os.hostname()}`,
        func: async (data: string) => {
            await new PublishConfigEvent(publisher, data).handle()
        },
    },
    {
        alias: `stats:${os.hostname()}`,
        func: async (data: string) => {
            await new StatsEvent(publisher).handle()
        },
    },
]
