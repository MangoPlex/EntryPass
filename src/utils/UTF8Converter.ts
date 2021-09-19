// https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
// The code in the gist above is released to public domain
// Thanks @pascaldekloe :)

export namespace UTF8Converter {

    export function encodeToBytes(str: string) {
        let i = 0, bs = new Uint8Array(str.length * 4);
        for (let ci = 0; ci < str.length; ci++) {
            let c = str.charCodeAt(ci);
            if (c < 128) { bs[i++] = c; continue; }
            if (c < 2048) bs[i++] = c >> 6 | 192;
            else {
                if (c > 0xd7ff && c < 0xdc00) {
                    if (++ci >= str.length) throw new Error('UTF-8 encode: incomplete surrogate pair');
                    let c2 = str.charCodeAt(ci);
                    if (c2 < 0xdc00 || c2 > 0xdfff) throw new Error('UTF-8 encode: second surrogate character 0x' + c2.toString(16) + ' at index ' + ci + ' out of range');

                    c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                    bs[i++] = c >> 18 | 240;
                    bs[i++] = c >> 12 & 63 | 128;
                } else bs[i++] = c >> 12 | 224;
                bs[i++] = c >> 6 & 63 | 128;
            }
            bs[i++] = c & 63 | 128;
        }
        return bs.subarray(0, i);
    }

    export function decodeToString(bs: Uint8Array) {
        let i = 0, str = "";
        while (i < bs.length) {
            let c = bs[i++];
            if (c > 127) {
                if (c > 191 && c < 224) {
                    if (i >= bs.length) throw new Error('UTF-8 decode: incomplete 2-byte sequence');
                    c = (c & 31) << 6 | bs[i++] & 63;
                } else if (c > 223 && c < 240) {
                    if (i + 1 >= bs.length) throw new Error('UTF-8 decode: incomplete 3-byte sequence');
                    c = (c & 15) << 12 | (bs[i++] & 63) << 6 | bs[i++] & 63;
                } else if (c > 239 && c < 248) {
                    if (i + 2 >= bs.length) throw new Error('UTF-8 decode: incomplete 4-byte sequence');
                    c = (c & 7) << 18 | (bs[i++] & 63) << 12 | (bs[i++] & 63) << 6 | bs[i++] & 63;
                } else throw new Error('UTF-8 decode: unknown multibyte start 0x' + c.toString(16) + ' at index ' + (i - 1));
            }
            if (c <= 0xffff) str += String.fromCharCode(c);
            else if (c <= 0x10ffff) {
                c -= 0x10000;
                str += String.fromCharCode(c >> 10 | 0xd800);
                str += String.fromCharCode(c & 0x3FF | 0xdc00);
            } else throw new Error('UTF-8 decode: code point 0x' + c.toString(16) + ' exceeds UTF-16 reach');
        }
        return str;
    }

}