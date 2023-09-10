

// Take a thing and test to see if it is something (not null / undefined)
// The `maybeThing is T` means this can be used in an Array.filter(...) to remove nulls / undefineds with type safety
export const isSomething = <T>(maybeThing: T | null | undefined): maybeThing is T => maybeThing !== null && maybeThing !== undefined


/**
 * Takes an array or undefined; returns the array or empty array of the same type
 * If it is an array, cleans the array so it isSomething, so we can return T[]
 */
export const alwaysArray = <T>(maybeArray: (T | null | undefined)[] | null | undefined): T[] => Array.isArray(maybeArray) ? maybeArray.filter(isSomething) : []
