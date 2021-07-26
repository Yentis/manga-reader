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
import { defineComponent, ref, Ref } from 'vue'
import testAll from 'src/services/testService'
import { SiteType } from 'src/enums/siteEnum'
import { testArangScans } from 'src/services/test/arangscans'
import { testAsuraScans } from 'src/services/test/asurascans'
import { testBatoto } from 'src/services/test/batoto'
import { testEdelgardeScans } from 'src/services/test/edelgardescans'
import { testFirstKissManga } from 'src/services/test/firstkissmanga'
import { testGenkanio } from 'src/services/test/genkanio'
import { testHatigarmScans } from 'src/services/test/hatigarmscans'
import { testHiperDEX } from 'src/services/test/hiperdex'
import { testLeviatanScans } from 'src/services/test/leviatanscans'
import { testLynxScans } from 'src/services/test/lynxscans'
import { testMangaDex } from 'src/services/test/mangadex'
import { testMangago } from 'src/services/test/mangago'
import { testMangakakalot } from 'src/services/test/mangakakalot'
import { testMangaKomi } from 'src/services/test/mangakomi'
import { testManganelo } from 'src/services/test/manganelo'
import { testMangaTx } from 'src/services/test/mangatx'
import { testManhwaClub } from 'src/services/test/manhwaclub'
import { testMethodScans } from 'src/services/test/methodscans'
import { testReaperScans } from 'src/services/test/reaperscans'
import { testSleepingKnightScans } from 'src/services/test/sleepingknightscans'
import { testWebtoons } from 'src/services/test/webtoons'
import { testZeroScans } from 'src/services/test/zeroscans'
import { testFlameScans } from 'src/services/test/flamescans'
import { useQuasar } from 'quasar'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { testResetScans } from 'src/services/test/resetscans'
import { testCatManga } from 'src/services/test/catmanga'

export default defineComponent({
  name: 'MangaTest',

  setup () {
    const $q = useQuasar()
    const testing = ref(false)
    const message = ref('')

    let sortedSites: (SiteType | LinkingSiteType)[] = Object.values(SiteType)
    sortedSites = sortedSites.concat(Object.values(LinkingSiteType).filter((site) => !sortedSites.includes(site))).sort()
    const selectedSite: Ref<SiteType | LinkingSiteType> = ref(sortedSites[0])

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
        case SiteType.ArangScans:
          await doTest(testArangScans)
          break
        case SiteType.AsuraScans:
          await doTest(testAsuraScans)
          break
        case SiteType.Batoto:
          await doTest(testBatoto)
          break
        case SiteType.CatManga:
          await doTest(testCatManga)
          break
        case SiteType.EdelgardeScans:
          await doTest(testEdelgardeScans)
          break
        case SiteType.FirstKissManga:
          await doTest(testFirstKissManga)
          break
        case SiteType.FlameScans:
          await doTest(testFlameScans)
          break
        case SiteType.Genkan:
          await doTest(testGenkanio)
          break
        case SiteType.HatigarmScans:
          await doTest(testHatigarmScans)
          break
        case SiteType.HiperDEX:
          await doTest(testHiperDEX)
          break
        case SiteType.LeviatanScans:
          await doTest(testLeviatanScans)
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
        case SiteType.Manganelo:
          await doTest(testManganelo)
          break
        case SiteType.MangaTx:
          await doTest(testMangaTx)
          break
        case SiteType.ManhwaClub:
          await doTest(testManhwaClub)
          break
        case SiteType.MethodScans:
          await doTest(testMethodScans)
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
        case SiteType.Webtoons:
          await doTest(testWebtoons($q))
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
