/**
 * Message transmit types
 */
export namespace TransmitType {

    /** Request user's info. No other trailing data required */
    export const REQUEST_USER_INFO = 0x0;

    /** Request pass creation. The trailing data is the user's info */
    export const REQUEST_PASS_CREATION = 0x1;

    /** Import pass from trailing data */
    export const PASS_IMPORT = 0x2;

    /** Show pass though trailing data for verification */
    export const PASS_SHOW = 0x3;

    /** Request certificate root trust (Only needed for verifiers) */
    export const REQUEST_ROOT_TRUST = 0x4;

    /** Custom communication though Entry Pass protocol */
    export const CUSTOM = 0xF;

}