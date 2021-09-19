export abstract class HashFunction {

    abstract hash(data: Uint8Array): bigint;

}