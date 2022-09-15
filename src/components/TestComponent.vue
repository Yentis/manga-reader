<template>
  <q-card-actions
    vertical
    class="full-width"
  >
    <q-btn
      label="Test All"
      :loading="testing"
      @click="testAllSites"
    />

    <q-card-actions
      class="q-mt-sm q-pa-none"
    >
      <q-btn-dropdown
        :label="`Site ${selectedSite}`"
      >
        <q-list
          v-for="site in sortedSites"
          :key="site"
        >
          <q-item
            v-close-popup
            clickable
            @click="selectedSite = site"
          >
            <q-item-section>
              <q-item-label>{{ site }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn
        label="Test"
        :loading="testing"
        @click="testSite"
      />
    </q-card-actions>

    <p
      class="q-mt-sm q-mb-none message"
    >
      {{ message }}
    </p>
  </q-card-actions>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import testAll from '../services/testService'
import { SiteType } from '../enums/siteEnum'
import { testAsuraScans } from '../services/test/asurascans'
import { testBatoto } from '../services/test/batoto'
import { testFirstKissManga } from '../services/test/firstkissmanga'
import { testHiperDEX } from '../services/test/hiperdex'
import { testLeviatanScans } from '../services/test/leviatanscans'
import { testLynxScans } from '../services/test/lynxscans'
import { testMangaDex } from '../services/test/mangadex'
import { testMangago } from '../services/test/mangago'
import { testMangakakalot } from '../services/test/mangakakalot'
import { testMangaKomi } from '../services/test/mangakomi'
import { testManganato } from '../services/test/manganato'
import { testMangaTx } from '../services/test/mangatx'
import { testManhwaClub } from '../services/test/manhwaclub'
import { testReaperScans } from '../services/test/reaperscans'
import { testSleepingKnightScans } from '../services/test/sleepingknightscans'
import { testWebtoons } from '../services/test/webtoons'
import { testZeroScans } from '../services/test/zeroscans'
import { testFlameScans } from '../services/test/flamescans'
import { useQuasar } from 'quasar'
import { LinkingSiteType } from '../enums/linkingSiteEnum'
import { testResetScans } from '../services/test/resetscans'
import { testBiliBiliComics } from '../services/test/bilibilicomics'
import { testKitsu } from '../services/test/kitsu'
import { testAlphaScans } from '../services/test/alphascans'
import { testCubari } from '../services/test/cubari'
import { testLuminousScans } from 'src/services/test/luminousscans'
import { testTapas } from 'src/services/test/tapas'
import { testCopinComics } from 'src/services/test/copincomics'
import { testComikey } from 'src/services/test/comikey'

export default defineComponent({
  name: 'MangaTest',

  setup () {
    const $q = useQuasar()
    const testing = ref(false)
    const message = ref('')

    let sortedSites: (SiteType | LinkingSiteType)[] = Object.values(SiteType)
    sortedSites = sortedSites.concat(Object.values(LinkingSiteType).filter((site) => !sortedSites.includes(site))).sort()
    const selectedSite: Ref<SiteType | LinkingSiteType | undefined> = ref(sortedSites[0])

    const testAllSites = () => {
      testing.value = true
      message.value = ''

      testAll($q).then((errors) => {
        if (errors.length === 0) {
          message.value = 'All tests passed!'
          return
        }

        let messageBuilder = ''
        errors.forEach((item, i) => {
          console.error(item.error)
          if (i > 0) messageBuilder += '\n\n'

          if (item.error instanceof Error) {
            messageBuilder += `${item.site}: ${item.error.message}`
            return
          }
          if (typeof item.error === 'string') {
            messageBuilder += `${item.site}: ${item.error}`
            return
          }

          messageBuilder += `${item.site}: See console`
        })

        message.value = messageBuilder
      }).catch((error) => {
        handleError(error)
      }).finally(() => {
        testing.value = false
      })
    }

    const testSite = async () => {
      switch (selectedSite.value) {
        case SiteType.AlphaScans:
          await doTest(testAlphaScans)
          break
        case SiteType.AsuraScans:
          await doTest(testAsuraScans)
          break
        case SiteType.Batoto:
          await doTest(testBatoto)
          break
        case SiteType.BiliBiliComics:
          await doTest(testBiliBiliComics)
          break
        case SiteType.Comikey:
          await doTest(testComikey)
          break
        case SiteType.CopinComics:
          await doTest(testCopinComics)
          break
        case SiteType.Cubari:
          await doTest(testCubari)
          break
        case SiteType.FirstKissManga:
          await doTest(testFirstKissManga)
          break
        case SiteType.FlameScans:
          await doTest(testFlameScans)
          break
        case SiteType.HiperDEX:
          await doTest(testHiperDEX)
          break
        case LinkingSiteType.Kitsu:
          await doTest(testKitsu($q))
          break
        case SiteType.LeviatanScans:
          await doTest(testLeviatanScans)
          break
        case SiteType.LuminousScans:
          await doTest(testLuminousScans)
          break
        case SiteType.LynxScans:
          await doTest(testLynxScans)
          break
        case SiteType.MangaDex:
          await doTest(testMangaDex)
          break
        case SiteType.Mangago:
          await doTest(testMangago)
          break
        case SiteType.Mangakakalot:
          await doTest(testMangakakalot)
          break
        case SiteType.MangaKomi:
          await doTest(testMangaKomi)
          break
        case SiteType.Manganato:
          await doTest(testManganato)
          break
        case SiteType.MangaTx:
          await doTest(testMangaTx)
          break
        case SiteType.ManhwaClub:
          await doTest(testManhwaClub)
          break
        case SiteType.ReaperScans:
          await doTest(testReaperScans)
          break
        case SiteType.ResetScans:
          await doTest(testResetScans)
          break
        case SiteType.SleepingKnightScans:
          await doTest(testSleepingKnightScans)
          break
        case SiteType.Tapas:
          await doTest(testTapas)
          break
        case SiteType.Webtoons:
          await doTest(testWebtoons)
          break
        case SiteType.ZeroScans:
          await doTest(testZeroScans)
          break
        default:
          break
      }
    }

    const doTest = async (target: (() => Promise<void>) | Promise<void>) => {
      testing.value = true
      message.value = ''

      try {
        if (target instanceof Promise) {
          await target
        } else {
          await target()
        }
        message.value = 'All tests passed!'
      } catch (error) {
        handleError(error)
      } finally {
        testing.value = false
      }
    }

    const handleError = (error: unknown) => {
      console.error(error)

      if (error instanceof Error) {
        message.value = error.message
        return
      }
      if (typeof error === 'string') {
        message.value = error
        return
      }

      message.value = 'See console'
    }

    return {
      sortedSites,
      testing,
      message,
      selectedSite,
      testAllSites,
      testSite
    }
  }
})
</script>

<style lang="scss" scoped>

.message {
  white-space: pre-line;
}

</style>
