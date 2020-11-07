declare module 'relevancy' {
  interface Sorter<T> {
    sort: (array: T[], query: string, exec: (item: T, calc: (target: string) => unknown) => unknown) => T[]
  }

  interface Relevancy {
    Sorter: new <T> (options: { comparator: (a: T, b: T) => number }) => Sorter<T>
    sort: (array: string[], query: string) => string[]
  }

  const relevancy: Relevancy
  export default relevancy
}
