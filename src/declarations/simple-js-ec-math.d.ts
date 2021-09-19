declare module "simple-js-ec-math" {

    export class Curve {
        a: bigint; b: bigint;
        n: bigint; p: bigint;
        g: ModPoint;
        modSet: ModSet;

        constructor(
            a: bigint, b: bigint,
            n: bigint, p: bigint,
            g: ModPoint,
            modSet?: ModSet,
            postProcessings?: any
        );

        add(p1: ModPoint, p2: ModPoint): ModPoint;
        subtract(p1: ModPoint, p2: ModPoint): ModPoint;
        double(p: ModPoint): ModPoint;
        multiply(p: ModPoint, s: bigint): ModPoint;
        verify(p: ModPoint): boolean;
    }

    export class ModSet {
        p: bigint;

        constructor(p: bigint);

        random(): bigint;
        mod(n: bigint): bigint;
        add(a: bigint, b: bigint): bigint;
        subtract(a: bigint, b: bigint): bigint;
        multiply(a: bigint, b: bigint): bigint;
        divide(a: bigint, b: bigint): bigint;
        squareRoots(k: bigint): bigint[];
        power(a: bigint, b: bigint): bigint;
    }

    export class ModPoint {
        x: bigint; y: bigint;

        constructor(x: bigint, y: bigint);

        toJSON(): { x: string, y: string };
        toString(): string;

        static fromJSON(obj: { x: string, y: string }): ModPoint;
        static fromString(str: string): ModPoint;
    }

}