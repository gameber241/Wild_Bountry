import { _decorator, Component, UITransform, Vec3, Tween, tween, instantiate, Node, sp, Layers } from 'cc';
import { Symbol } from './Symbol';
import { PrefabManager } from '../Manager/PrefabManager';
import { GameManager, waitForSeconds } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('ReelBase')
export abstract class ReelBase {
    @property(Node)
    maskEff: Node = null
    @property(sp.Skeleton)
    spinesEff: sp.Skeleton = null
    protected symbolPadding = 1.5;
    public symbols: Symbol[] = [];

    protected cellSize = 0;
    protected totalSize = 0;
    protected halfSize = 0;

    _delay = 0.04;
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
    listSymbol = []
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
        tween(this.reelNode)
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
            })
            .union()
            .repeatForever()
            .start();

    }


    stopRoll(result: any[]) {
        this.isRolling = false;
        this._isStopping = true;

        Tween.stopAllByTarget();

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

        Tween.stopAllByTarget();

        this.startRoll();
    }
    public cascadeDrop(dataAbove: any[]) {
        const aboveData = this.isHorizontal() ? dataAbove : [...dataAbove].reverse();

        this.symbols = this.symbols.filter(
            s => s.node && s.node.isValid
        );

        let space = 0
        let min = this.VISIBLE_COUNT
        let max = min * 2 - 1

        let listSymbok = []

        for (let i = max; i >= min; i--) {
            let s = this.symbols.find(e => e.reelIndex == i)
            if (s == undefined || s == null) {
                space++
            }
            else {
                if (space > 0) {
                    const oldRow = s.row;
                    s.row += space
                    s.reelIndex += space
                    if (oldRow >= 0 && GameManager.instance.symBolArray[s.col][oldRow] === s) {
                        GameManager.instance.symBolArray[s.col][oldRow] = null;
                    }
                    listSymbok.push(s)
                    GameManager.instance.symBolArray[s.col][s.row] = s
                }
            }
        }
        const createCount = Math.min(space, aboveData.length)
        for (let i = createCount - 1; i >= 0; i--) {
            let Symbol = this.createNewSymbol()
            this.symbols.push(Symbol)
            Symbol.reelIndex = min + i
            Symbol.node.setPosition(this.getSymbolPosition(Symbol.reelIndex - createCount))
            Symbol.reel = this
            Symbol.InitSymbol(aboveData[i]);
            listSymbok.push(Symbol)
            Symbol.col = this.possitionReel
            Symbol.row = i
            GameManager.instance.symBolArray[Symbol.col][Symbol.row] = Symbol
        }

        listSymbok.forEach((e, i) => {
            GameManager.waitForSeconds(0.05)
            e.DropToindex(0.1)
        })

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