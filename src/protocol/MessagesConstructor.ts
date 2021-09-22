import { ByteOutputStream } from "../streams/ByteOutputStream";
import { Pass } from "../passes/Pass";
import { ByteInputStream } from "../streams/ByteInputStream";
import { UserInformation } from "../passes/UserInformation";
import { TransmitType } from "./TransmitType";
import { Certificate } from "..";

/**
 * Messages constructor to construct messages for QR codes
 */
export namespace MessagesConstructor {

    // "PASS" + messageHeader + trailing data...
    export const QRCODE_HEADER = new Uint8Array([0x50, 0x41, 0x53, 0x53]);

    export function messageHeader(compressed: boolean, id: number) {
        return (compressed? 0b1000_0000 : 0) | (id & 0xF);
    }

    export function parseHeader(byte: number): [number, boolean] {
        let id = byte & 0xF;
        let compressed = (byte & 0b1000_0000) != 0;
        return [id, compressed];
    }

    export function requestUserInfo() {
        return new Uint8Array([
            ...QRCODE_HEADER,
            messageHeader(false, TransmitType.REQUEST_USER_INFO)
        ]);
    }

    export function streamOf(id: number) {
        let stream = new ByteOutputStream(128);
        stream.writeBytes(QRCODE_HEADER);
        stream.writeByte(messageHeader(false, id));
        return stream;
    }

    export function requestPassCreation(info: UserInformation) {
        let stream = streamOf(TransmitType.REQUEST_PASS_CREATION);
        info.writeToStream(stream);
        return stream.toBytes();
    }

    export function importPass(pass: Pass) {
        let stream = streamOf(TransmitType.PASS_IMPORT);
        pass.writeToStream(stream);
        return stream.toBytes();
    }

    export function showPass(pass: Pass) {
        let stream = streamOf(TransmitType.PASS_SHOW);
        pass.writeToStream(stream);
        return stream.toBytes();
    }

    export function requestRootTrust(root: Certificate) {
        if (root.parent) throw new Error("The given certificate must be a root");
        if (!root.hasSignature) throw new Error("The given certificate must be self-signed");
        let stream = streamOf(TransmitType.REQUEST_ROOT_TRUST);
        root.writeToStream(stream);
        return stream.toBytes();
    }

    export function processQRCodeMessage(msg: Uint8Array) {
        for (let i = 0; i < QRCODE_HEADER.length; i++) if (msg[i] != QRCODE_HEADER[i]) return null;
        let stream = new ByteInputStream(msg);
        stream.pointer += QRCODE_HEADER.length;

        let msgObj = <Message> { data: msg };
        [msgObj.id, msgObj.compressed] = parseHeader(stream.readByte());
        switch (msgObj.id) {
        case TransmitType.REQUEST_USER_INFO: msgObj.info = UserInformation.readFromStream(stream); break;

        case TransmitType.PASS_IMPORT:
        case TransmitType.PASS_SHOW: msgObj.pass = Pass.readFromStream(stream); break;

        case TransmitType.REQUEST_ROOT_TRUST: msgObj.certificate = Certificate.readFromStream(stream); break;

        case TransmitType.REQUEST_PASS_CREATION: break;
        default: return null;
        }
        return msgObj;
    }

    export interface Message {
        compressed: boolean;
        id: number;
        data: Uint8Array;

        certificate?: Certificate;
        info?: UserInformation;
        pass?: Pass;
    }

}