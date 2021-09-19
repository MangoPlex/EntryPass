import { Curve, ModPoint } from "simple-js-ec-math";

export namespace ProtocolConstants {

    export const secp256r1 = new Curve(
        0xffffffff00000001000000000000000000000000fffffffffffffffffffffffcn, // a
        0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn, // b
        0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n, // n
        0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn, // p
        new ModPoint(
            0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n,
            0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n
        )
    );

}