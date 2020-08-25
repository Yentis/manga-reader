import * as dropbox from 'dropbox'

declare module 'dropbox' {
    export namespace files {
        interface FileMetadata {
            fileBlob: Blob
        }

        interface Response {
            statusText: string
        }

        interface Error {
            response: Response
        }
    }
}
