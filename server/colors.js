// rgb() / rgba() with an optional, ignored alpha channel
var rgbPattern =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i;
// hsl() / hsla() with an optional, ignored alpha channel
var hslPattern =
    /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)$/i;

/**
 * Converts a CSS color to a six-digit hex string for use in document
 * attributes. Understands #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(),
 * hsl(), hsla() and named colors. Any alpha channel is dropped.
 *
 * @param {string} color a CSS color value
 * @returns {?string} color as six-digit hex (e.g. #0000ff), or null if it
 *     can't be represented as an opaque hex color (e.g. 'transparent', an
 *     unknown keyword, or a malformed value)
 */
function colorToHex(color) {
    color = color.toString().trim();
    var lower = color.toLowerCase();

    var hashStart = color.indexOf('#');
    if (hashStart !== -1) {
        return hexToSixDigit(color.slice(hashStart));
    }

    var rgb = lower.match(rgbPattern);
    if (rgb) {
        return channelsToHex([
            parseInt(rgb[1], 10),
            parseInt(rgb[2], 10),
            parseInt(rgb[3], 10)
        ]);
    }

    var hsl = lower.match(hslPattern);
    if (hsl) {
        return channelsToHex(hslToRgb(
            parseFloat(hsl[1]), parseFloat(hsl[2]), parseFloat(hsl[3])
        ));
    }

    if (Object.prototype.hasOwnProperty.call(colors, lower)) {
        return colors[lower];
    }

    return null;
}

/**
 * Normalizes any hex color (with or without leading '#', 3/4/6/8 digits) to
 * six-digit '#rrggbb', dropping a 4th/8th alpha nibble.
 *
 * @param {string} hex
 * @returns {?string} six-digit hex, or null if the value isn't valid hex
 */
function hexToSixDigit(hex) {
    hex = hex.replace('#', '').toLowerCase();

    if (hex.length === 4) {
        hex = hex.slice(0, 3); // #rgba -> #rgb
    } else if (hex.length === 8) {
        hex = hex.slice(0, 6); // #rrggbbaa -> #rrggbb
    }

    if (hex.length === 3) {
        // https://en.wikipedia.org/wiki/Web_colors#Shorthand_hexadecimal_form
        hex = hex.charAt(0) + hex.charAt(0) +
            hex.charAt(1) + hex.charAt(1) +
            hex.charAt(2) + hex.charAt(2);
    }

    return /^[0-9a-f]{6}$/.test(hex) ? '#' + hex : null;
}

/**
 * @param {Array.<number>} channels [r, g, b], each 0-255
 * @returns {string} six-digit hex, each channel zero-padded to two digits
 */
function channelsToHex(channels) {
    var hex = channels.reduce(function toHexByte(result, n) {
        n = Math.max(0, Math.min(255, Math.round(n)));
        var s = n.toString(16);
        return result + (s.length === 1 ? '0' + s : s);
    }, '');

    return '#' + hex;
}

/**
 * @param {number} h hue in degrees (0-360)
 * @param {number} s saturation percentage (0-100)
 * @param {number} l lightness percentage (0-100)
 * @returns {Array.<number>} [r, g, b], each 0-255
 */
function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    s = s / 100;
    l = l / 100;

    if (s === 0) {
        var gray = Math.round(l * 255);
        return [gray, gray, gray];
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    return [
        hueToChannel(p, q, h + 1 / 3),
        hueToChannel(p, q, h),
        hueToChannel(p, q, h - 1 / 3)
    ];
}

function hueToChannel(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return Math.round((p + (q - p) * 6 * t) * 255);
    }
    if (t < 1 / 2) {
        return Math.round(q * 255);
    }
    if (t < 2 / 3) {
        return Math.round((p + (q - p) * (2 / 3 - t) * 6) * 255);
    }
    return Math.round(p * 255);
}

var colors = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred : '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgrey: '#d3d3d3',
    lightgreen: '#90ee90',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370d8',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#d87093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32'
};
