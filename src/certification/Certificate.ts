import { UseCase } from "./UseCase";
import { SHAModified } from "../hashing/SHAModified";
import { IntegersConverter } from "../utils/IntegersConverter";
import { UTF8Converter } from "../utils/UTF8Converter";
import { Key } from "../keys/Key";
import { Randomizer } from "..";
import { ByteOutputStream } from "../streams/ByteOutputStream";
import { ByteInputStream } from "../streams/ByteInputStream";
import { CertificateVerifyResponse } from "./CertificateVerifyResponse";

/**
 * The cerificate class. Cerificates are signed with parent cerificate, and you can
 * prove the cerificate valid by checking the signature with parent cerificate public
 * key.
 * 
 * Cerificates are important because they can let governments authorize who can create
 * passes in a limited amount of time.
 */
export class Certificate {

    constructor(
        public parent: Certificate,
        public publicKey: [boolean, bigint],
        public name: string,
        public useCases: number,
        public expireOn: number,
        public signature = [0n, 0n]
    ) {}

    /**
     * Check the use case for this certificate
     * @param useCase The use case to check
     */
    checkUseCase(useCase: number) { return (this.useCases & useCase) != 0; }
    get canCreatePernamentPass() { return this.checkUseCase(UseCase.CREATE_PERNAMENT_PASSES); }
    get canCreateTimedPass() { return this.checkUseCase(UseCase.CREATE_TIME_LIMITED_PASSES); }
    get canSignCertificate() { return this.checkUseCase(UseCase.CREATE_CERIFICATES); }

    static readFromStream(stream: ByteInputStream): Certificate {
        let keySize = 256 / 8;

        //const parentCert = stream.readEncodedBytes();
        //if (parentCert.length > 0) parent = this.fromBinary(parentCert);
        let parent: Certificate = null;
        if (stream.readByte() == 1) parent = this.readFromStream(stream);
        
        let publicYOddity = stream.readByte() == 1;
        let publicKey = stream.readBigInt(keySize);

        const nameBytes = stream.readEncodedBytes();
        let name = UTF8Converter.decodeToString(nameBytes);

        let useCases = stream.readByte();
        let expireOn = stream.readInt(8);

        let signature = [0n, 0n];
        signature[0] = stream.readBigInt(32);
        signature[1] = stream.readBigInt(32);

        return new Certificate(parent, [publicYOddity, publicKey], name, useCases, expireOn, signature);
    }

    static fromBinary(bs: Uint8Array): Certificate {
        let stream = new ByteInputStream(bs);
        return this.readFromStream(stream);
    }

    writeToStream(stream: ByteOutputStream) {
        let keySize = 256 / 8;

        //const parentCert = this.parent? this.parent.binary : new Uint8Array(0);
        //stream.writeEncodedBytes(parentCert);
        stream.writeByte(this.parent? 1 : 0);
        if (this.parent) this.parent.writeToStream(stream);

        stream.writeByte(this.publicKey[0]? 1 : 0);
        stream.writeBigInt(this.publicKey[1], keySize);

        const nameBytes = UTF8Converter.encodeToBytes(this.name);
        stream.writeEncodedBytes(nameBytes);

        stream.writeByte(this.useCases);
        stream.writeInt(this.expireOn, 8);

        stream.writeBigInt(this.signature[0], keySize);
        stream.writeBigInt(this.signature[1], keySize);
    }

    get binary(): Uint8Array {
        let stream = new ByteOutputStream(128);
        this.writeToStream(stream);
        return stream.toBytes();
    }

    get keyObject() { return Key.uncompressPublic(...this.publicKey); }

    get binaryWithoutSignature() {
        let keySize = 256 / 8;
        let arr = this.binary;
        return arr.subarray(0, arr.length - keySize * 2);
    }

    get hash() { return new SHAModified().hash(this.binaryWithoutSignature); }

    get hasSignature() { return this.signature[0] != 0n && this.signature[1] != 0n; }

    /**
     * Sign this certificate. If this certificate does not have parent, this function fill perform
     * self sign
     * @param key The key
     * @param rnd Randomizer
     */
    signCertificate(key: Key, rnd: Randomizer) {
        let hash = this.hash;
        if (this.parent == null) {
            if (!Key.comparePublic(key, this.keyObject)) throw new Error("provided public key does not match with this certificate");
        }
        else if (!Key.comparePublic(this.parent.keyObject, key)) throw new Error("provided public key does not match with parent certificate public key");
        this.signature = key.sign(hash, rnd.randomBigInteger(64));
    }

    verify(): CertificateVerifyResponse {
        if (Date.now() > this.expireOn) return { success: false, reason: `Certificate '${this.name}': Expired` };
        if (!this.hasSignature) return { success: false, reason: `Certificate '${this.name}': No signature` };

        let hash = this.hash;
        if (this.parent) {
            if (this.expireOn > this.parent.expireOn) return { success: false, reason: `Certificate '${this.name}': This certificate has longer lifetime than parent certificate` }
            let parentVerify = this.parent.verify();
            if (!parentVerify.success) return parentVerify;
            if (!this.parent.canSignCertificate) return { success: false, reason: `Certificate '${this.parent.name}': No permission to sign other certificates` };
            if (!this.verifyUseCases) return { success: false, reason: `Certificate '${this.name}': Permissions inheritance check failed` };

            let key = this.parent.keyObject;
            try {
                let success = key.verify(hash, this.signature);
                return { success, reason: success? `Certificate '${this.name}': Signature valid` : `Certificate '${this.name}': Signature invalid` }
            } catch (e) {
                return { success: false, reason: `Error occured while verifying signature: ` + e.message };
            }
        } else {
            try {
                let success = this.keyObject.verify(hash, this.signature);
                return { success, reason: success? `Certificate '${this.name}': Root Certificate Signature valid` : `Certificate '${this.name}': Root Certificate Signature invalid` }
            } catch (e) {
                return { success: false, reason: `Error occured while verifying signature: ` + e.message };
            }
        }
    }

    get verifyUseCases() {
        if (!this.parent) return true;
        return !(
            (this.canCreatePernamentPass && !this.parent.canCreatePernamentPass) ||
            (this.canCreateTimedPass && !this.parent.canCreateTimedPass)
        );
    }

    get json() {
        return <CertificateJSON> {
            parent: this.parent? this.parent.json : null,
            publicKey: [this.publicKey[0], "0x" + this.publicKey[1].toString(16)],
            name: this.name,
            useCases: this.useCases,
            expireOn: this.expireOn,
            signature: this.signature.map(v => "0x" + v.toString(16))
        };
    }

    get rootCertificate(): Certificate {
        if (this.parent == null) return this;
        return this.parent.rootCertificate;
    }

    /** Quickly compare 2 certificates using SHAModified hash */
    static quickCompare(a: Certificate, b: Certificate) { return a.json == b.hash; }

}

export interface CertificateJSON {
    parent?: CertificateJSON;
    publicKey: [boolean, string];
    name: string;
    useCases: number;
    expireOn: number;
    signature: string[];
}