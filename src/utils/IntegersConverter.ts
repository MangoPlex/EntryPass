export namespace IntegersConverter {

    export function writeBigInt(v: bigint, bs: Uint8Array, offset: number, length: number) {
        for (let i = 0; i < length; i++) bs[offset + i] = Number((v & (0xFFn << BigInt(i * 8))) >> BigInt(i * 8));
    }

    export function readBigInt(bs: Uint8Array, offset: number, length: number) {
        let v = 0n;
        for (let i = 0; i < length; i++) v |= BigInt(bs[offset + i]) << BigInt(i * 8);
        return v;
    }

    export function bigIntToBytes(bytes: number, a: bigint) {
        let arr = new Uint8Array(bytes);
        writeBigInt(a, arr, 0, bytes);
        return arr;
    }

    export function bytesToBigInt(bs: Uint8Array) { return readBigInt(bs, 0, bs.length); }

    export function writeInt(v: number, bs: Uint8Array, offset: number, length: number) { writeBigInt(BigInt(v), bs, offset, length); }
    export function readInt(bs: Uint8Array, offset: number, length: number) { return Number(readBigInt(bs, offset, length)); }

    export function intToBytes(bytes: number, v: number) {return bigIntToBytes(bytes, BigInt(v)); }
    export function bytesToInt(bs: Uint8Array) { return Number(bytesToBigInt(bs)); }

}