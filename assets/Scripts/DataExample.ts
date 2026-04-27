import { SymbolType } from "./Enum/ESymbolFace";
import { SymbolFrameState } from "./Enum/SymbolFrameState";

export const sampleJson = {
    success: true,
    totalWin: 2250,
    usingFreeSpin: false,

    rounds: [{
        index: 0,
        multiplier: 1,
        isScratch: false,
        freeSpin: 0,
        totalPrice: 0,
        grid: [
            // Reel 0
            [
                { i: 5, f: SymbolFrameState.GOLD },
                { i: 5, f: SymbolFrameState.GOLD },
                { i: 3, f: SymbolFrameState.GOLD },
            ],

            // Reel 1 
            [
                { i: 9, f: 0 },
                { i: 5, f: 0 },
                { i: 3, f: 0 },
                { i: 4, f: 0 },
            ],

            // Reel 2 
            [
                { i: 7, f: 0 },
                { i: 8, f: 0 },
                { i: 5, f: 0 },
                { i: 7, f: 0 },
                { i: 9, f: 0 }
            ],

            // Reel 3
            [
                { i: 0, f: 0 },
                { i: 1, f: 0 },
                { i: 7, f: 0 },
                { i: 5, f: 0 },
                { i: 4, f: 0 }
            ],

            // Reel 4
            [
                { i: 7, f: 0 },
                { i: 9, f: 0 },
                { i: 4, f: 0 },
                { i: 5, f: 0 }
            ],

            // Reel 5
            [
                { i: 6, f: 0 },
                { i: 7, f: 0 },
                { i: 2, f: 0 },
            ],

        ],

        above: [
            [{ i: 6, f: 0 },{ i: 7, f: 0 },],
            [{ i: 6, f: 0 }],
            [{ i: 6, f: 0 }],
            [{ i: 6, f: 0 }],
            [{ i: 6, f: 0 }],
        ],

        win: {
            positions: [
                { c: 0, r: 0 },
                { c: 0, r: 1 },
                { c: 1, r: 1 },
                { c: 2, r: 2 },
                { c: 3, r: 3 },
                { c: 4, r: 3 },
            ],

            stepWin: 2000
        },
        flips: [],
        copies: [],
        hasNext: false,
        total: 30,
        comboNext: 3

    }
    ]
};

