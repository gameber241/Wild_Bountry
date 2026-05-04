import { _decorator, Component, UITransform, Vec3, Tween, tween, instantiate, Node, sp, Layers } from 'cc';
import { Symbol } from './Symbol';
import { PrefabManager } from '../Manager/PrefabManager';
import { GameManager, waitForSeconds } from '../Manager/GameManager';
import { SymbolType } from '../Enum/ESymbolFace';
const { ccclass, property } = _decorator;

@ccclass('ReelBase')
export abstract class ReelBase {
    @property(sp.Skeleton)
    spinesEff: sp.Skeleton = null
    public symbolPadding = 1.5;
    public symbols: Symbol[] = [];

    protected cellSize = 0;
    protected totalSize = 0;
    protected halfSize = 0;

    _delay = 0.06;
    protected _isStopping = false;
    protected _remainSteps = 0;

    @property(Number)
    possitionReel: number = 0

    isRolling = false;

    @property(Number)
    numberSymbols: number = 9;

    public abstract VISIBLE_COUNT: number;
    public abstract FIRST_VISIBLE: number;

    reelNode: Node = null
    listSymbol: Node[] = []
    init(reelNode: Node) {
        this.reelNode = reelNode
        for (let i = 0; i < this.numberSymbols; i++) {
            let symbol = instantiate(PrefabManager.instance.symbolPrefab);
            reelNode.addChild(symbol);
            this.listSymbol.push(symbol)
        }

        this.collectSymbols();
        this.rearrangeSymbols();
    }

    protected collectSymbols() {
        this.symbols = [];
        for (let n of this.listSymbol) {
            const s = n.getComponent(Symbol);
            if (s) {
                s.reel = this;
                s.reelIndex = this.symbols.length;
                this.symbols.push(s);
                s.ResetSymbol()
            }
        }

        const ui = this.symbols[0].node.getComponent(UITransform);
        this.cellSize = this.getCellSize(ui) + this.symbolPadding;
        this.totalSize = this.cellSize * this.symbols.length;
        this.computeHalfSize();
    }

    protected rearrangeSymbols() {
        for (let s of this.symbols) {
            s.node.position = this.getSymbolPosition(s.reelIndex);
        }
    }


    startRoll() {
        this._isStopping = false;
        this.isRolling = true;
        this.collectSymbols();
        this.rearrangeSymbols();
        this.symbols.forEach(e => {
            e.icon.node.layer = Layers.Enum.DEFAULT
            e.frame.node.layer = Layers.Enum.DEFAULT
            e.isInit = false
            e.node.active = true
        })
        console.log(this.listSymbol[0].uuid, this.possitionReel, "check", "start")
        tween(this.listSymbol[0])
            .call(() => {
                if (this.isRolling === false) return;
                for (let s of this.symbols) {
                    s.reelIndex += 1
                    if (s.reelIndex >= this.symbols.length) {
                        s.reelIndex = 0;
                        if (!this._isStopping) {
                            s.ResetSymbol();
                        }
                        s.node.position = this.getSymbolPosition(-1);
                    }
                    
                    s.rollToIndex(this._delay, Symbol.MoveType.MOVING);

                }

            })
            .delay(this._delay)
            .call(() => {
                // this.sortSibling();
                console.log("con nua")
            })
            .union()
            .repeatForever()
            .start();

    }


    stopRoll(result: any[]) {
        this.isRolling = false;
        this._isStopping = true;
        console.log(this.listSymbol[0].uuid, this.possitionReel, "check", "end")

        Tween.stopAllByTarget(this.listSymbol[0]);

        const total = this.symbols.length;
        const visible = this.VISIBLE_COUNT;
        const firstVisible = this.FIRST_VISIBLE;


        this.symbols.sort((a, b) => a.reelIndex - b.reelIndex);
        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].reelIndex = i;
        }
        const indexMap = new Map<number, Symbol>();
        for (let sym of this.symbols) {
            indexMap.set(sym.reelIndex, sym);
        }

        for (let i = 0; i < visible; i++) {
            const targetIndex = (firstVisible + i) % total;
            const placeIndex = (targetIndex - visible + total) % total;
            let s = indexMap.get(placeIndex);
            if (!s) {
                console.warn("⚠ Missing symbol at index:", placeIndex);
                s = this.symbols[i % this.symbols.length];
            }
            const dataIndex = i
            s.InitSymbol(result[dataIndex]);
            s.col = this.possitionReel;
            s.row = dataIndex;
            if (GameManager.instance?.symBolArray) {
                GameManager.instance.symBolArray[s.col][s.row] = s;
            }
        }

        this.symbols.forEach(s => {
            s.reelIndex += visible;
            s.rollToIndex(this._delay * 5, Symbol.MoveType.STOP);
        });

        // SoundToggle.instance?.PlaySymbolDrop();
    }
    changeSpeed(newDelay: number) {
        this._delay = newDelay;

        Tween.stopAllByTarget(this.listSymbol[0]);

        this.startRoll();
    }


    ShowAllSymbol() {
        this.listSymbol.forEach(e => {
            e.setSiblingIndex(91)
            if (e.getComponent(Symbol).face == SymbolType.SCRATCH || e.getComponent(Symbol).face == SymbolType.WILD) {
                e.setSiblingIndex(92)

            }
        })
    }

    HideSymbolDifScratch() {
        this.listSymbol.forEach(e => {
            if (e.getComponent(Symbol).face != SymbolType.SCRATCH) {
                e.setSiblingIndex(0)

            }
        })
    }

    // public cascadeDrop(dataAbove: any[]) {
    //     const aboveData = this.isHorizontal() ? dataAbove : [...dataAbove].reverse();

    //     this.symbols = this.symbols.filter(
    //         s => s.node && s.node.isValid
    //     );

    //     let space = 0
    //     let min = this.VISIBLE_COUNT
    //     let max = min * 2 - 1

    //     let listSymbok = []

    //     for (let i = max; i >= min; i--) {
    //         let s = this.symbols.find(e => e.reelIndex == i)
    //         if (s == undefined || s == null) {
    //             space++
    //         }
    //         else {
    //             if (space > 0) {
    //                 const oldRow = s.row;
    //                 s.row += space
    //                 s.reelIndex += space
    //                 if (oldRow >= 0 && GameManager.instance.symBolArray[s.col][oldRow] === s) {
    //                     GameManager.instance.symBolArray[s.col][oldRow] = null;
    //                 }
    //                 listSymbok.push(s)
    //                 GameManager.instance.symBolArray[s.col][s.row] = s
    //             }
    //         }
    //     }
    //     const createCount = Math.min(space, aboveData.length)
    //     for (let i = createCount - 1; i >= 0; i--) {
    //         let Symbol = this.createNewSymbol()
    //         this.symbols.push(Symbol)
    //         Symbol.reelIndex = min + i
    //         Symbol.node.setPosition(this.getSymbolPosition(Symbol.reelIndex - createCount))
    //         Symbol.reel = this
    //         Symbol.InitSymbol(aboveData[i]);
    //         listSymbok.push(Symbol)
    //         Symbol.col = this.possitionReel
    //         Symbol.row = i
    //         GameManager.instance.symBolArray[Symbol.col][Symbol.row] = Symbol
    //     }

    //     listSymbok.forEach((e, i) => {
    //         GameManager.waitForSeconds(0.05)
    //         e.DropToindex(0.1)
    //     })

    // }
    public async cascadeDrop(dataAbove: any[]) {
        const aboveData = this.isHorizontal() ? dataAbove : [...dataAbove].reverse();
        this.symbols = this.symbols.filter(s => s.node && s.node.isValid);
        let space = 0;
        let min = this.VISIBLE_COUNT;
        let max = min * 2 - 1;
        let existingSymbols: any[] = [];
        let newSymbols: any[] = [];
        for (let i = max; i >= min; i--) {
            let s = this.symbols.find(e => e.reelIndex == i);
            if (!s) {
                space++;
            } else {
                if (space > 0) {
                    const oldRow = s.row;
                    s.row += space;
                    s.reelIndex += space;
                    if (oldRow >= 0 && GameManager.instance.symBolArray[s.col][oldRow] === s) {
                        GameManager.instance.symBolArray[s.col][oldRow] = null;
                    }
                    existingSymbols.push(s);
                    GameManager.instance.symBolArray[s.col][s.row] = s;
                }
            }
        }
        const createCount = Math.min(space, aboveData.length);
        for (let i = createCount - 1; i >= 0; i--) {
            let Symbol = this.createNewSymbol();
            Symbol.reelIndex = min + i;
            Symbol.node.setPosition(this.getSymbolPosition(Symbol.reelIndex - createCount));

            Symbol.reel = this;
            Symbol.InitSymbol(aboveData[i]);

            Symbol.col = this.possitionReel;
            Symbol.row = i;
            GameManager.instance.symBolArray[Symbol.col][Symbol.row] = Symbol;
            newSymbols.push(Symbol);
        }
        for (let i = 0; i < existingSymbols.length; i++) {
            await GameManager.waitForSeconds(0.05);
            existingSymbols[i].DropToindex(0.05);
        }

        await GameManager.waitForSeconds(0.3);

        this.symbols.forEach(e => {
            e.shakeNode()
        })
        // delay tổng sau khi symbol cũ rơi xong
        await GameManager.waitForSeconds(0.3);

        for (let i = 0; i < newSymbols.length; i++) {
            this.symbols.push(newSymbols[i]);
            this.listSymbol.push(newSymbols[i].node)

            await GameManager.waitForSeconds(0.05);
            newSymbols[i].DropToindex(0.05);
        }
    }

    private createNewSymbol(): Symbol {
        let symbol = instantiate(PrefabManager.instance.symbolPrefab);
        this.reelNode.addChild(symbol);

        return symbol.getComponent(Symbol);
    }


    public isHorizontal(): boolean { return false; }

    public abstract getCellSize(ui: UITransform): number;
    public abstract computeHalfSize(): void;
    public abstract getSymbolPosition(index: number): Vec3;
    public abstract sortSibling(): void;


}