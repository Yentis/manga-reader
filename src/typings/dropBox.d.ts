import dropbox from 'dropbox';

declare module 'dropbox' {
    export namespace files {
        interface FileMetadata {
            fileBlob: Blob
        }
    }
}
