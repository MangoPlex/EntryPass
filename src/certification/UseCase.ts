export namespace UseCase {

    /** Allow key holder to create pernament passes (passes that won't expire) */
    export const CREATE_PERNAMENT_PASSES    = 0b00000001;

    /** Allow key holder to create time limited passes */
    export const CREATE_TIME_LIMITED_PASSES = 0b00000010;

    /**
     * Allow key holder to create cerificates. This is the dangerous permission,
     * because the key holder can create more cerificates and potentially destroy
     * the use of passes. Only grant this to trusted party.
     */
    export const CREATE_CERIFICATES         = 0b00000100;

}