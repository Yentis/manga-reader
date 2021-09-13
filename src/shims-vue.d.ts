// Mocks all files ending in `.vue` showing them as plain Vue instances
declare module '*.vue' {
  import { ComponentOptions } from '@vue/runtime-core/dist/runtime-core'
  const component: ComponentOptions
  export default component
}
