export namespace BigIntegers {

    export function gcd(a: bigint, b: bigint) {
        let c: bigint;
        while (true) {
            c = a % b;
            if (c == 0n) return b;
            a = b;
            b = c;
        }
    }

    export function modPow(base: bigint, exp: bigint, mod: bigint) {
        if (mod == 1n) return 0n;
        let result = 1n;
        base = base % mod;
        while (exp > 0) {
            if ((exp % 2n) == 1n) result = (result * base) % mod;
            exp >>= 1n;
            base = (base * base) % mod;
        }
        return result;
    }

}