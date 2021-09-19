import * as ec from "simple-js-ec-math";
import { BigIntegers, Randomizer } from "..";
import { ProtocolConstants } from "../ProtocolConstants";

export class Key {

    privateKey?: bigint;
    x: bigint;
    y: bigint;

    /**
     * Create new keypair from private key. The public key is gathered from
     * elliptic curve point multiplication
     * @param privateKey The private key
     */
    constructor(privateKey: bigint);

    /**
     * Create new key from public point
     * @param publicX The public point X
     * @param publicY The public point Y
     */
    constructor(publicX: bigint, publicY: bigint);
    constructor(a: bigint, b?: bigint) {
        if (b != null) { this.x = a; this.y = b; }
        else {
            this.privateKey = a;
            if (a < 0n) throw new Error("private key is negative");
            if (a > ProtocolConstants.secp256r1.n) throw new Error("key is too big");

            let G = ProtocolConstants.secp256r1.g;
            let P = ProtocolConstants.secp256r1.multiply(G, this.privateKey);
            this.x = P.x;
            this.y = P.y;
        }
    }

    get compressedPublic(): [boolean, bigint] { return [(this.y % 2n) == 0n, this.x]; }

    static uncompressPublic(parity: boolean, x: bigint) {
        let curve = ProtocolConstants.secp256r1;
        let y2 = curve.modSet.add(curve.modSet.power(x, 3n), curve.modSet.add(curve.modSet.multiply(curve.a, x), curve.b));
        let y_1 = curve.modSet.squareRoots(y2)[0];
        let y_2 = curve.p - y_1;

        let yM2 = (y_1 % 2n) == 0n? y_1 : y_2;
        let yN2 = (y_1 % 2n) == 0n? y_2 : y_1;
        let y = parity? yM2 : yN2;
        return new Key(x, y);
    }

    /**
     * Generate keypair that can be compressed
     * @param rnd The randomizer
     * @returns The keypair
     */
    static generate(rnd: Randomizer) {
        let priv: bigint;
        do { priv = rnd.randomBigInteger(32); } while (priv > ProtocolConstants.secp256r1.b);
        return new Key(priv);
    }

    /**
     * Sign the message with custom k value
     * @param hash The hash of your message
     * @param k Random number from 0
     * @returns The signature
     */
    sign(hash: bigint, k: bigint) {
        if (this.privateKey == null) throw new Error("missing private key");
        let curve = ProtocolConstants.secp256r1;
        k %= curve.n;
        let R = curve.multiply(curve.g, k);
        let r = R.x;
        let s = ((this.privateKey * r + hash) * modInverse(k, curve.n)) % curve.n;
        return [r, s];
    }

    verify(hash: bigint, signature: bigint[]) {
        let curve = ProtocolConstants.secp256r1;
        let r = signature[0];
        let s = signature[1];

        let w = modInverse(s, curve.n);
        let u1 = (hash * w) % curve.n;
        let u2 = (r * w) % curve.n;
        let p = curve.add(curve.multiply(curve.g, u1), curve.multiply(new ec.ModPoint(this.x, this.y), u2));
        return p.x == r;
    }

    static comparePublic(a: Key, b: Key) { return a.x == b.x && a.y == b.y; }

}

function egcd(a: bigint, b: bigint) {
    if (b == 0n) return [a, 1n, 0n];
    let x1: bigint, y1: bigint;
    let d: bigint;
    [d, x1, y1] = egcd(b, a % b);
    return [d, y1, x1 - y1 * (a / b)];
}

function modInverse(v: bigint, m: bigint) {
    let x: bigint, y: bigint, g: bigint;
    [g, x, y] = egcd(v, m);
    if (g != 1n) throw new Error("no solution");
    x = (x % m + m) % m;
    return x;
}