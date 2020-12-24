export class RefreshOptions {
  enabled: boolean
  period: number

  constructor (enabled = false, period = 15) {
    this.enabled = enabled
    this.period = period
  }

  equals (other: RefreshOptions) {
    return this.enabled === other.enabled && this.period === other.period
  }
}
