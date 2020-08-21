export class NotifyOptions {
    message: Error | string
    type = 'negative'
    timeout: number | undefined = undefined
    position: 'bottom' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'center' | undefined = undefined
    closeBtn: boolean | string = false
    actions: Array<{ label: string, handler?: () => void, color?: string }> | undefined

    constructor (message: Error | string) {
      this.message = message
    }

    getOptions () {
      return {
        type: this.type,
        message: this.message instanceof Error ? this.message.message : this.message,
        timeout: this.timeout,
        position: this.position,
        closeBtn: this.closeBtn,
        actions: this.actions
      }
    }
}
