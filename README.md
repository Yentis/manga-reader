# Manga Reader
Manga reader that scrapes manga sites for new chapters.  
Allows you to read chapters inside the application using Electron or Cordova.

Currently supported sites:  
https://github.com/Yentis/manga-reader/blob/master/src/enums/siteEnum.ts

Supported platforms:
- Windows
- Android
- [Web](https://yentis.github.io/mangareader/) (Requires CORS extension)

Features:
- Check all added manga for new chapters
- Read manga in the app
- Mark status, add notes, add ratings
- Sort, filter and search
- Link reading progress with MangaDex or Kitsu
- Share list using [Rentry](https://rentry.co/)
- Export to / import from Dropbox
- Dark mode, read in browser
- Automatically check for new chapters every x minutes, this will send a notification to your device (off by default)
- Fallback to alternate sources

# Download
https://github.com/Yentis/manga-reader/releases

# Preview
![Preview](https://i.imgur.com/Eb57CBG.png)
![Preview](https://i.imgur.com/DBIHfyq.png)
![Preview](https://i.imgur.com/s60v5ox.png)
![Preview](https://i.imgur.com/cIxMTUs.png)
![Preview](https://i.imgur.com/vnUMa8q.png)
![Preview](https://i.imgur.com/Sh31aEb.png)
![Preview](https://i.imgur.com/EHw91vu.png)

# Support
For support contact Yentis#5218 on Discord.  

# Building

yarn global add @quasar/cli  
yarn install  
quasar dev

See package.json for build targets
