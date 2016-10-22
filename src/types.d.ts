export interface IHash {
    [index:string]:any
}

/**
 * Polyfill for missing ava typings
 */
export interface TestAfter {
    always(t: Function): void
}
