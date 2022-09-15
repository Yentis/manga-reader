export class NotifyOptions {
    message: Error | string
    type: 'positive' | 'negative' | 'warning' | 'info' | 'ongoing' = 'negative'
    timeout: number | undefined = undefined
    position: 'bottom' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'center' | undefined = undefined
    closeBtn: boolean | string = false
    actions: { label: string, handler?: () => void, color?: string }[] | undefined
    caption: string | undefined = undefined

    constructor (message: Error | string, title: string | undefined = undefined) {
      if (title) {
        this.message = title
        if (message instanceof Error) {
          this.caption = message.message
        } else {
          this.caption = message
        }
      } else {
        if (message instanceof Error) {
          this.message = message.message
        } else {
          this.message = message
        }
      }
    }

    getOptions () {
      return {
        type: this.type,
        message: this.message instanceof Error ? this.message.message : this.message,
        timeout: this.timeout,
        position: this.position,
        closeBtn: this.closeBtn,
        actions: this.actions,
        caption: this.caption
      }
    }
}
