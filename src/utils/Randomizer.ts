export abstract class Randomizer {

    /**
     * Get random byte value
     */
    abstract randomByte(): number;

    randomBigInteger(bytes = 32) {
        let out = 0n;
        for (let i = 0; i < bytes; i++) out |= BigInt(this.randomByte()) << BigInt(i * 8);
        return out;
    }

}