export {}

declare global {
    interface CookieMaster {
        setCookieValue: (domain: string, name: string, value: string, successCallback: () => void, failureCallback: (error: string) => void) => void
    }

    interface Window {
        cookieMaster: CookieMaster
    }
}
