import { Constants } from 'src/classes/constants'

declare module 'vue/types/vue' {
    interface Vue {
        $constants: Constants
    }
}
