export default interface ElectronWindow {
  mangaReader: {
    onDropboxToken: ((event: unknown, token?: string) => void),
    onGitlabToken: ((event: unknown, token?: string) => void),
    openURL: (url: string) => void
  }
}
