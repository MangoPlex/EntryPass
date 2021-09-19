import { Randomizer } from "./Randomizer";

/**
 * Unsecure randomizer. This randomizer should never be used for generating
 * secrets (such as private keys). But sometimes secure randomizer isn't
 * available in the client machine, which mean you'll have to use unsecure
 * randomizer
 */
export class UnsecureRandomizer extends Randomizer {
    randomByte() { return Math.floor(Math.random() * 256); }
}