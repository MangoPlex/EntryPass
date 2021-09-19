import { Certificate, CertificateJSON, Randomizer, SHAModified } from "..";
import { Key } from "../keys/Key";
import { ByteInputStream } from "../streams/ByteInputStream";
import { ByteOutputStream } from "../streams/ByteOutputStream";
import { PassVerifyResponse } from "./PassVerifyResponse";
import { UserInformation, UserInformationJSON } from "./UserInformation";

export class Pass {

    /**
     * Construct new pass data
     * @param certificate The certificate of passes issuer
     * @param info User's information
     * @param expireOn When this pass expire in MS (0 for pernament pass)
     * @param signature The issuer's signature
     */
    constructor(
        public certificate: Certificate,
        public info: UserInformation,
        public expireOn: number,
        public signature = [0n, 0n]
    ) {}

    get isPernament() { return this.expireOn == 0; }
    get isExpired() { return !this.isPernament && Date.now() > this.expireOn; }

    writeToStream(stream: ByteOutputStream) {
        this.certificate.writeToStream(stream);
        this.info.writeToStream(stream);
        stream.writeInt(this.expireOn, 8);
        stream.writeBigInt(this.signature[0], 32);
        stream.writeBigInt(this.signature[1], 32);
    }
        
    get binary() {
        let stream = new ByteOutputStream(256);
        this.writeToStream(stream);
        return stream.toBytes();
    }

    get hash() {
        let bs = this.binary;
        bs = bs.subarray(0, bs.length - 64);
        return new SHAModified().hash(bs);
    }

    static readFromStream(stream: ByteInputStream) {
        let certificate = Certificate.readFromStream(stream);
        let info = UserInformation.readFromStream(stream);
        let expireOn = stream.readInt(8);
        let signature = [0n, 0n];
        signature[0] = stream.readBigInt(32);
        signature[1] = stream.readBigInt(32);
        return new Pass(certificate, info, expireOn, signature);
    }

    static fromBinary(bs: Uint8Array) {
        let stream = new ByteInputStream(bs);
        return this.readFromStream(stream);
    }

    async signPass(key: Key, rnd: Randomizer) {
        if (!Key.comparePublic(key, this.certificate.keyObject)) throw new Error("provided key does not match with certificate public key");
        let hash = this.hash;
        this.signature = key.sign(hash, rnd.randomBigInteger(64));
    }

    verify(): PassVerifyResponse {
        let certVerify = this.certificate.verify();
        if (!certVerify.success) return { success: false, reason: certVerify.reason };
        if (this.isExpired) return { success: false, reason: `Pass: The pass is expired` };
        if (this.isPernament && !this.certificate.canCreatePernamentPass) return { success: false, reason: `Pass: The issuer doesn't have permission to create pernament passes` };
        if (this.expireOn > this.certificate.expireOn) return { success: false, reason: `Pass: The pass lifetime is longer than issuer's certificate lifetime` };

        try {
            let success = this.certificate.keyObject.verify(this.hash, this.signature);
            return { success, reason: success? `Pass: Signed by '${this.certificate.name}'` : `Pass: Signature check failed` };;
        } catch (e) {
            return { success: false, reason: `Error occured while verifying signature: ` + e.message };
        }
    }

}

export interface PassJSON {
    user: UserInformationJSON;
    certificate: CertificateJSON;
}