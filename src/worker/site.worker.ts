import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { doOperation } from './helper'
import { ArangScansWorker } from 'src/classes/sites/arang/arangscansWorker'
import { SiteType } from 'src/enums/siteEnum'
import { BaseWorker } from 'src/classes/sites/baseWorker'
import { AsuraScansWorker } from 'src/classes/sites/asura/asurascansWorker'
import { BatotoWorker } from 'src/classes/sites/batoto/batotoWorker'
import { CatMangaWorker } from 'src/classes/sites/catmanga/catmangaWorker'
import { GenkanioWorker } from 'src/classes/sites/genkanio/genkanioWorker'
import { MangaDexWorker } from 'src/classes/sites/mangadex/mangadexWorker'
import { MangagoWorker } from 'src/classes/sites/mangago/mangagoWorker'
import { ManhwaClubWorker } from 'src/classes/sites/manhwaclub/manhwaclubWorker'
import { WebtoonsWorker } from 'src/classes/sites/webtoons/webtoonsWorker'
import { ManganeloWorker } from 'src/classes/sites/manganelo/manganeloWorker'
import { MangakakalotWorker } from 'src/classes/sites/mangakakalot/mangakakalotWorker'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { KitsuWorker } from 'src/classes/sites/kitsu/kitsuWorker'
import handleKitsuRequest from './kitsuHandler'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  let worker: BaseWorker

  switch (request.siteType) {
    case SiteType.Manganelo:
      worker = new ManganeloWorker(request.requestConfig)
      break
    case SiteType.Webtoons:
      worker = new WebtoonsWorker(request.platform, request.requestConfig)
      break
    case SiteType.HatigarmScans:
      worker = new GenkanWorker(request.siteType, request.requestConfig)
      break
    case SiteType.FirstKissManga:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.Mangakakalot:
      worker = new MangakakalotWorker(request.requestConfig)
      break
    case SiteType.MangaDex:
      worker = new MangaDexWorker(request.requestConfig)
      break
    case SiteType.MangaKomi:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.MethodScans:
      worker = new GenkanWorker(request.siteType, request.requestConfig)
      break
    case SiteType.LeviatanScans:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.HiperDEX:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.ReaperScans:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.AsuraScans:
      worker = new AsuraScansWorker(request.siteType, request.requestConfig)
      break
    case SiteType.ManhwaClub:
      worker = new ManhwaClubWorker(request.requestConfig)
      break
    case SiteType.MangaTx:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.Mangago:
      worker = new MangagoWorker(request.platform, request.requestConfig)
      break
    case SiteType.SleepingKnightScans:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.ZeroScans:
      worker = new GenkanWorker(request.siteType, request.requestConfig)
      break
    case SiteType.LynxScans:
      worker = new GenkanWorker(request.siteType, request.requestConfig)
      break
    case SiteType.Batoto:
      worker = new BatotoWorker(request.requestConfig)
      break
    case SiteType.ArangScans:
      worker = new ArangScansWorker(request.requestConfig)
      break
    case SiteType.EdelgardeScans:
      worker = new GenkanWorker(request.siteType, request.requestConfig)
      break
    case SiteType.Genkan:
      worker = new GenkanioWorker(request.requestConfig)
      break
    case SiteType.FlameScans:
      worker = new AsuraScansWorker(request.siteType, request.requestConfig)
      break
    case SiteType.ResetScans:
      worker = new WordPressWorker(request.siteType, request.requestConfig)
      break
    case SiteType.CatManga:
      worker = new CatMangaWorker(request.requestConfig)
      break
    case LinkingSiteType.Kitsu: {
      const kitsuWorker = new KitsuWorker(request.data.get('token') as string, request.requestConfig)
      const requestHandled = handleKitsuRequest(request, kitsuWorker)
      if (requestHandled) return

      worker = kitsuWorker
      break
    }
    default:
      return
  }

  doOperation(request, worker)
})

export default Worker
