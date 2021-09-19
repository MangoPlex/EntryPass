import { SHAModified, UnsecureRandomizer, UTF8Converter } from "..";
import { ByteInputStream } from "../streams/ByteInputStream";
import { ByteOutputStream } from "../streams/ByteOutputStream";

/**
 * General user's information. Entry Pass uses your information and send it to
 * pass distributors for them to generate passes.
 * 
 * You can leave informations blank, but sometime verifier need it for recognizing
 * you (such as your name, country and an portrait image of your face)
 */
export class UserInformation {

    info: UserInformationJSON;

    constructor(info: UserInformationJSON) {
        this.info = {
            name: info.name || ("0x" + new UnsecureRandomizer().randomBigInteger(16).toString(16)),
            gender: info.gender || "undefined",
            country: info.country || "international",
            birthTime: info.birthTime || 0,
            socialId: info.socialId || "00000-00000-00000-00000",
            regionalPhoneNumber: info.regionalPhoneNumber || "+0 (000) 0000-000",
            imageURL: info.imageURL || ""
        };
    }

    writeToStream(stream: ByteOutputStream) {
        stream.writeEncodedBytes(UTF8Converter.encodeToBytes(this.info.name));
        stream.writeEncodedBytes(UTF8Converter.encodeToBytes(this.info.gender));
        stream.writeEncodedBytes(UTF8Converter.encodeToBytes(this.info.country));
        stream.writeInt(this.info.birthTime, 8);
        stream.writeEncodedBytes(UTF8Converter.encodeToBytes(this.info.socialId));
        stream.writeEncodedBytes(UTF8Converter.encodeToBytes(this.info.regionalPhoneNumber));
        stream.writeEncodedBytes(UTF8Converter.encodeToBytes(this.info.imageURL));
    }

    get binary() {
        let stream = new ByteOutputStream(64);
        this.writeToStream(stream);
        return stream.toBytes();
    }

    get hash() { return new SHAModified().hash(this.binary); }

    static readFromStream(stream: ByteInputStream) {
        let name = UTF8Converter.decodeToString(stream.readEncodedBytes());
        let gender = UTF8Converter.decodeToString(stream.readEncodedBytes());
        let country = UTF8Converter.decodeToString(stream.readEncodedBytes());
        let birthTime = stream.readInt(8);
        let socialId = UTF8Converter.decodeToString(stream.readEncodedBytes());
        let regionalPhoneNumber = UTF8Converter.decodeToString(stream.readEncodedBytes());
        let imageURL = UTF8Converter.decodeToString(stream.readEncodedBytes());
        return new UserInformation({ name, gender, country, birthTime, socialId, regionalPhoneNumber, imageURL });
    }

    static fromBinary(bs: Uint8Array) {
        let stream = new ByteInputStream(bs);
        return this.readFromStream(stream);
    }

}

export interface UserInformationJSON {
    /** Your name (either legal name or username) */
    name?: string;

    /** Your gender (male/female/undefined/other gender) */
    gender?: string;

    /** Country (international if you don't need country details) */
    country?: string;

    /** Birth time in MS (0 if you don't need birth date details) */
    birthTime?: number;

    /** Social ID (default is 00000-00000-00000-00000, the format is different across countries) */
    socialId?: string;

    /**
     * Regional phone number, which starts with regional code (e.g: +1 or +84). The phone
     * number is different across regions
     */
    regionalPhoneNumber?: string;

    /**
     * URL to image. Used in public for identifying your face with pass information.
     * 
     * We suggest encrypted image file on IPFS for storing user's faces, because IPFS
     * is everywhere. But this information is up to you to decide.
     */
    imageURL?: string;
}