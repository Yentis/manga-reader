import { Manga } from './manga'

export class UpdateManga {
  manga: Manga
  index: number

  constructor (manga: Manga, index: number) {
    this.manga = manga
    this.index = index
  }
}
