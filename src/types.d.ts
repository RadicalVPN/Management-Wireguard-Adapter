export interface ITrafficStats {
    [key: string]: {
        rx: number
        tx: number
    }
}

export interface ConfigPublishEvent {
    config: string
}
