export enum SymbolType {
    // Special
    WILD = 0,
    SCRATCH = 1,
    Cowboy = 2,
    Gun = 3,
    Hat = 4,
    Bottle = 5,
    A = 6,
    K = 7,
    Q = 8,
    J = 9
}

export const SymbolPayoutConfig = {
    [SymbolType.WILD]: {
        count: "",
        value: ""
    },

    [SymbolType.SCRATCH]: {
        count: "",
        value: ""
    },

    // High symbols
    [SymbolType.Cowboy]: {
        count: "6\n5\n4\n3",
        value: "50\n30\n20\n10"
    },

    [SymbolType.Gun]: {
        count: "6\n5\n4\n3",
        value: "30\n20\n15\n8"
    },

    [SymbolType.Hat]: {
        count: "6\n5\n4\n3",
        value: "20\n15\n10\n5"
    },

    [SymbolType.Bottle]: {
        count: "6\n5\n4\n3",
        value: "20\n15\n10\n5"
    },

    // Low symbols
    [SymbolType.A]: {
        count: "6\n5\n4\n3",
        value: "10\n6\n4\n2"
    },

    [SymbolType.K]: {
        count: "6\n5\n4\n3",
        value: "10\n6\n4\n2"
    },

    [SymbolType.Q]: {
        count: "6\n5\n4\n3",
        value: "5\n3\n2\n1"
    },

    [SymbolType.J]: {
        count: "6\n5\n4\n3",
        value: "5\n3\n2\n1"
    }
};