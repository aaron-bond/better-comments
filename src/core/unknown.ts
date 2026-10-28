// Helpers for reading values whose type isn't known: settings and other extensions' package.json

/**
 * Reads a property of a value of unknown type, as value[key] would, or undefined if the value isn't an object
 */
export function property(value: unknown, key: string): unknown {
    return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
}
