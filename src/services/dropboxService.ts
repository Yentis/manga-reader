import { Dropbox } from 'dropbox'
import { Manga } from 'src/classes/manga';
import fetch from 'isomorphic-fetch'

const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
const MANGA_LIST_FILENAME = 'manga-reader.json'

export function saveList (accessToken: string, mangaList: Manga[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const contents = JSON.stringify(mangaList)

        if (contents.length >= UPLOAD_FILE_SIZE_LIMIT) return reject(Error('File too large'))
    
        new Dropbox({
            accessToken,
            fetch
        }).filesUpload({
            path: `/${MANGA_LIST_FILENAME}`,
            contents,
            mode: {
                '.tag': 'overwrite'
            }
        }).then(() => resolve()).catch(error => reject(error))
    })
}

export function readList (accessToken: string): Promise<Manga[]> {
    return new Promise((resolve, reject) => {
        new Dropbox({
            accessToken,
            fetch
        }).filesDownload({
            path: `/${MANGA_LIST_FILENAME}`
        }).then(response => {
            const reader = new FileReader()

            reader.onload = function () {
                if (typeof this.result !== 'string') return reject(Error('Failed to read file'))
                resolve(JSON.parse(this.result))
            }

            reader.readAsText(response.fileBlob)
        }).catch(error => console.error(error))
    })
}
