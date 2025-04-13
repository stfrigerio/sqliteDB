/**
 * Calculates whether black or white text provides better contrast against a given hex background color.
 * Uses YIQ formula.
 * @param hexcolor - The background color in hex format (e.g., "#RRGGBB", "#RGB").
 * @returns '#000000' (black) or '#FFFFFF' (white).
 */
export function getContrastYIQ(hexcolor: string): string {
    if (!hexcolor) return '#000000'; // Default to black if no color provided

    // Remove '#' if present
    hexcolor = hexcolor.replace("#", "");

    let r: number, g: number, b: number;

    // Handle short hex codes (#RGB)
    if (hexcolor.length === 3) {
        r = parseInt(hexcolor.substr(0, 1).repeat(2), 16);
        g = parseInt(hexcolor.substr(1, 1).repeat(2), 16);
        b = parseInt(hexcolor.substr(2, 1).repeat(2), 16);
    }
    // Handle full hex codes (#RRGGBB)
    else if (hexcolor.length === 6) {
        r = parseInt(hexcolor.substr(0, 2), 16);
        g = parseInt(hexcolor.substr(2, 2), 16);
        b = parseInt(hexcolor.substr(4, 2), 16);
    } else {
        // Invalid format, default to black
        console.warn(`Invalid hex color format for contrast calculation: ${hexcolor}`);
        return '#000000';
    }

    // Calculate YIQ (luminance)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Threshold (standard value is 128, adjust if needed)
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}