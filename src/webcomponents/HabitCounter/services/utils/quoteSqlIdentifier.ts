/**
 * Safely quotes an identifier (table or column name) for use in SQL queries.
 * Prevents basic SQL injection via identifiers and handles reserved words.
 * Only allows alphanumeric characters and underscores. Wraps in double quotes.
 * @param identifier - The identifier string to quote.
 * @returns The quoted identifier string.
 * @throws Error if the identifier contains invalid characters.
 */
export function quoteSqlIdentifier(identifier: string): string {
    //? Basic security check for valid characters
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
        throw new Error(`Invalid identifier used: "${identifier}". Only alphanumeric and underscores allowed.`);
    }
    //? SQLite standard quoting is double quotes
    return `"${identifier}"`;
}