import { IntegersConverter, UTF8Converter } from "..";

export class ByteInputStream {

    pointer = 0;

    constructor(public bs: Uint8Array) {}

    get endOfStream() { return this.pointer >= this.bs.length; }

    readBytes(bs: Uint8Array, offset = 0, length = bs.length): number {
        if (length == 0) return 0;
        if (length < 0) throw new Error("negative length");
        if (offset + length > bs.length) throw new Error("out of bound (offset + length > bs.length)");
        
        if (this.pointer >= this.bs.length) return 0;
        let actualBytesToRead = Math.min(this.bs.length - this.pointer, length);
        bs.set(this.bs.subarray(this.pointer, this.pointer + actualBytesToRead));
        this.pointer += length;
        return actualBytesToRead;
    }

    readByte(): number {
        if (this.pointer >= this.bs.length) return -1;
        return this.bs[this.pointer++];
    }

    readInt(length = 4) {
        let v = IntegersConverter.readInt(this.bs, this.pointer, length);
        this.pointer += length;
        return v;
    }
    readBigInt(length = 32) {
        let v = IntegersConverter.readBigInt(this.bs, this.pointer, length);
        this.pointer += length;
        return v;
    }

    readVarInt() {
        let b = 0, v = 0, sh = 0;
        do {
            b = this.readByte();
            v |= (b & 0x7F) << sh;
            sh += 7;
        } while ((b & 0x80) != 0);
        return v;
    }

    readEncodedBytes() {
        let length = this.readVarInt();
        let bytes = new Uint8Array(length);
        this.readBytes(bytes);
        return bytes;
    }

}