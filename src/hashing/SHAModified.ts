import { HashFunction } from "./HashFunction";

/**
 * A slightly modified SHA256 function. Why it's slightly modified? Well that's because
 * the result hash does not match with other SHA256 implementation
 */
export class SHAModified extends HashFunction {

    hash(data: Uint8Array): bigint {
        const chunks = Math.floor((data.length + 1) / 64) + 1;
        const bytes = chunks * 64 - 8;
        
        const arr = new Uint8Array(bytes);
        arr.set(data, 0);
        arr[data.length] = 0x80;
        arr[arr.length - 1] = (data.length & 0x00_00_00_00_FF);
        arr[arr.length - 2] = (data.length & 0x00_00_00_FF_00) >> 8;
        arr[arr.length - 3] = (data.length & 0x00_00_FF_00_00) >> 16;
        arr[arr.length - 4] = (data.length & 0x00_FF_00_00_00) >> 24;
        arr[arr.length - 5] = (data.length & 0xFF_00_00_00_00) >> 32;

        const hB = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ];
        const k = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ];

        const w = new Array<number>(64);
        function bytes2Int32(offset: number, word: number) {
            return (arr[offset + word * 4] << 24) | (arr[offset + word * 4 + 1] << 16) | (arr[offset + word * 4 + 2] << 8) | (arr[offset + word * 4 + 3]);
        }
        function rotateRight(v32: number, amount: number) {
            const amountBn = BigInt(amount);
            let v32bn = BigInt(v32);
            const andVal = (1n << amountBn) - 1n;
            const toRot = v32bn & andVal;
            v32bn >>= amountBn;
            v32bn |= toRot << (32n - amountBn);
            return Number(v32bn);
        }
        function int32Clamp(v: number) { return Number(BigInt(v) & 0xFFFFFFFFn); }
        function not(a: number) { return Number(BigInt(a) ^ 0xFFFFFFFFn); }
        for (let chunk = 0; chunk < chunks; chunk++) {
            for (let i = 0; i < 16; i++) w[i] = bytes2Int32(chunk * 64, i);
            for (let i = 16; i < 64; i++) w[i] = 0;
            for (let i = 16; i < 64; i++) {
                let s0 = rotateRight(w[i - 15], 7) ^ rotateRight(w[i - 15], 18) ^ (w[i - 15] >> 3);
                let s1 = rotateRight(w[i - 2], 17) ^ rotateRight(w[i - 2], 19) ^ (w[i - 2] >> 10);
                w[i] = int32Clamp(w[i - 16] + s0 + w[i - 7] + s1);
            }

            let a = hB[0], b = hB[1], c = hB[2], d = hB[3], e = hB[4], f = hB[5], g = hB[6], h = hB[7];
            for (let i = 0; i < 64; i++) {
                let S1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
                let ch = (e & f) ^ (not(e) & g);
                let tmp1 = int32Clamp(h + S1 + ch + k[i] + w[i]);
                let S0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
                let maj = (a & b) ^ (a & c) ^ (b & c);
                let tmp2 = int32Clamp(S0 + maj);
                h = g;
                g = f;
                f = e;
                e = int32Clamp(d + tmp1);
                d = c;
                c = b;
                b = a;
                a = int32Clamp(tmp1 + tmp2);
            }

            hB[0] = int32Clamp(hB[0] + a);
            hB[1] = int32Clamp(hB[1] + b);
            hB[2] = int32Clamp(hB[2] + c);
            hB[3] = int32Clamp(hB[3] + d);
            hB[4] = int32Clamp(hB[4] + e);
            hB[5] = int32Clamp(hB[5] + f);
            hB[6] = int32Clamp(hB[6] + g);
            hB[7] = int32Clamp(hB[7] + h);
        }

        return (BigInt(hB[0]) << 224n) | (BigInt(hB[1]) << 192n) | (BigInt(hB[2]) << 160n) | (BigInt(hB[3]) << 128n) | (BigInt(hB[4]) << 96n) | (BigInt(hB[5]) << 64n) | (BigInt(hB[6]) << 32n) | BigInt(hB[7]);
    }

}