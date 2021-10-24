interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}

interface IdleRequestOptions {
    timeout?: number;
}

export default interface ChromeWindow {
  requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number;
}
