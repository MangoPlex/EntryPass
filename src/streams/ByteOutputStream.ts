import { IntegersConverter } from "..";

export class ByteOutputStream {

    buffersPool: Uint8Array[] = [];
    pointer = 0;

    constructor(public bufferSize = 128) {}

    get poolPointer() { return Math.floor(this.pointer / this.bufferSize); }

    allocateBuffers(nextBytes: number) {
        let prevPointer = this.poolPointer;
        let nextPointer = Math.floor((this.pointer + nextBytes) / this.bufferSize);
        for (let i = prevPointer; i <= nextPointer; i++) if (!this.buffersPool[i]) this.buffersPool[i] = new Uint8Array(this.bufferSize);
    }

    writeBytes(bs: Uint8Array, offset = 0, length = bs.length) {
        if (length == 0) return;
        if (length < 0) throw new Error("negative length");
        if (offset + length > bs.length) throw new Error("out of bound (offset + length > bs.length)");

        let bs2 = bs.subarray(offset, offset + length);
        this.allocateBuffers(length);

        let nextBuffWrites: number;
        let written = 0;
        do {
            nextBuffWrites = Math.min(bs2.length - written, this.bufferSize - (this.pointer % this.bufferSize));
            this.buffersPool[this.poolPointer].set(bs2.subarray(written, written + nextBuffWrites), this.pointer % this.bufferSize);
            written += nextBuffWrites;
            this.pointer += nextBuffWrites;
        } while (nextBuffWrites > 0);
    }

    writeByte(v: number) {
        this.allocateBuffers(1);
        this.buffersPool[Math.floor(this.pointer / this.bufferSize)][this.pointer % this.bufferSize] = v;
        this.pointer++;
    }

    toBytes() {
        let arr = new Uint8Array(this.pointer);
        for (let i = 0; i < arr.length; i += this.bufferSize) {
            arr.set(this.buffersPool[i / this.bufferSize].subarray(0, Math.min(arr.length - i, this.bufferSize)), i);
        }
        return arr;
    }

    writeInt(v: number, length = 4) { this.writeBytes(IntegersConverter.intToBytes(length, v), 0, length); }
    writeBigInt(v: bigint, length = 32) { this.writeBytes(IntegersConverter.bigIntToBytes(length, v), 0, length); }

    writeVarInt(v: number) {
        let b = 0;
        do {
            b = v & 0x7F;
            v >>= 7;
            b |= v > 0? 0x80 : 0;
            this.writeByte(b);
        } while (v > 0);
    }

    writeEncodedBytes(bytes: Uint8Array) {
        this.writeVarInt(bytes.length);
        this.writeBytes(bytes);
    }

}