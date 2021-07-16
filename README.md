# Manga Reader
Manga reader that scrapes manga sites for new chapters.  
Allows you to read chapters inside the application using Electron or Cordova.

Currently supported sites:  
https://github.com/Yentis/manga-reader/blob/master/src/enums/siteEnum.ts

Supported platforms:
- Windows
- Android
- macOS

Features:
- Check all added manga for new chapters
- Read manga in the app
- Mark status, add notes, add ratings
- Sort, filter and search
- Link reading progress with MangaDex or Kitsu
- Share list using Gitlab
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

When building locally there is an issue with isomorphic-git on cordova where it will throw an error on cloning the repository.  
Go to node_modules/isomorphic-git/index.js and change  
for (const [i, start] of offsetArray.entries()) { }  
to  
offsetArray.forEach((start, i) => { }
