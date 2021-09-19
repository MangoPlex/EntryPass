import { ByteOutputStream } from "../streams/ByteOutputStream";
import { Pass } from "../passes/Pass";
import { ByteInputStream } from "../streams/ByteInputStream";
import { UserInformation } from "../passes/UserInformation";
import { TransmitType } from "./TransmitType";

/**
 * Messages constructor to construct messages for QR codes
 */
export namespace MessagesConstructor {

    export function messageHeader(compressed: boolean, id: number) {
        return (compressed? 0b1000_0000 : 0) | id;
    }

    export function parseHeader(byte: number): [number, boolean] {
        let id = byte & 0xF;
        let compressed = (byte & 0b1000_0000) != 0;
        return [id, compressed];
    }

    export function sendUserInfo(info: UserInformation) {
        let stream = new ByteOutputStream(256);
        stream.writeByte(messageHeader(false, TransmitType.USER_INFO));
        info.writeToStream(stream);
        return stream.toBytes();
    }

    export function sendPass(pass: Pass) {
        let stream = new ByteOutputStream(256);
        stream.writeByte(messageHeader(false, TransmitType.PASS_INFO));
        pass.writeToStream(stream);
        return stream.toBytes();
    }

    export function processMessage(msg: Uint8Array) {
        let stream = new ByteInputStream(msg);
        let compressed: boolean, id: number;
        [id, compressed] = parseHeader(stream.readByte());
        switch (id) {
        case TransmitType.USER_INFO: return UserInformation.readFromStream(stream);
        case TransmitType.PASS_INFO: return Pass.readFromStream(stream);
        default: throw new Error("Unknown ID: " + id);
        }
    }

}