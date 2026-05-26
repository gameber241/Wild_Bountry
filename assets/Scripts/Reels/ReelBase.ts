import { _decorator, Component, UITransform, Vec3, Tween, tween, instantiate, Node, sp, Layers } from 'cc';
import { Symbol } from './Symbol';
import { PrefabManager } from '../Manager/PrefabManager';
import { GameManager, waitForSeconds } from '../Manager/GameManager';
import { SymbolType } from '../Enum/ESymbolFace';
import { AudioManager } from '../Game/AudioManager';
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

    _delay = 0.05;
    protected _isStopping = false;
    protected _remainSteps = 0;

    @property(Number)
    possitionReel: number = 0

    isRolling = false;

    @property(Number)
    numberSymbols: number = 9;

    reelProtect: Node = null

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
    private normalizeSymbolCount() {
        // Loại bỏ node đã bị destroy
        this.listSymbol = this.listSymbol.filter(node => node && node.isValid);
        this.symbols = this.symbols.filter(symbol => symbol && symbol.node && symbol.node.isValid);

        // Đồng bộ symbols từ listSymbol để tránh lệch mảng
        this.symbols = [];
        for (const node of this.listSymbol) {
            const symbol = node.getComponent(Symbol);
            if (symbol) {
                symbol.reel = this;
                this.symbols.push(symbol);
            }
        }

        // -------------------------------------------------
        // Nếu THIẾU symbol -> tạo thêm
        // -------------------------------------------------
        while (this.symbols.length < this.numberSymbols) {
            const symbol = this.createNewSymbol();

            symbol.reel = this;
            symbol.reelIndex = this.symbols.length;

            // Reset để có icon hợp lệ
            symbol.ResetSymbol();

            // Đặt ở vị trí phía trên reel (index = -1)
            symbol.node.setPosition(this.getSymbolPosition(-1));
            symbol.node.active = true;

            this.listSymbol.push(symbol.node);
            this.symbols.push(symbol);

            console.warn(
                `➕ Added missing symbol: ${this.symbols.length}/${this.numberSymbols}`
            );
        }

        // -------------------------------------------------
        // Nếu THỪA symbol -> xóa bớt từ cuối mảng
        // -------------------------------------------------
        while (this.symbols.length > this.numberSymbols) {
            const symbol = this.symbols.pop();
            if (!symbol || !symbol.node || !symbol.node.isValid) {
                continue;
            }

            const idx = this.listSymbol.indexOf(symbol.node);
            if (idx !== -1) {
                this.listSymbol.splice(idx, 1);
            }

            symbol.node.destroy();

            console.warn(
                `➖ Removed extra symbol: ${this.symbols.length}/${this.numberSymbols}`
            );
        }

        // -------------------------------------------------
        // Cập nhật reelIndex lại cho toàn bộ symbol
        // -------------------------------------------------
        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            symbol.reel = this;
            symbol.reelIndex = i;
        }

        // Cập nhật thông số kích thước
        if (this.symbols.length > 0) {
            const ui = this.symbols[0].node.getComponent(UITransform);
            this.cellSize = this.getCellSize(ui) + this.symbolPadding;
            this.totalSize = this.cellSize * this.symbols.length;
            this.computeHalfSize();
        }

        console.log(
            `✅ Reel ${this.possitionReel}: ${this.symbols.length}/${this.numberSymbols}`
        );
    }


    startRoll() {
        this._isStopping = false;
        this.isRolling = true;

        // Chuẩn hóa số lượng symbol trước khi spin
        this.normalizeSymbolCount();

        this.rearrangeSymbols();

        this.symbols.forEach(e => {
            e.icon.node.layer = Layers.Enum.DEFAULT;
            e.frame.node.layer = Layers.Enum.DEFAULT;
            e.isInit = false;
            e.node.active = true;
        });

        console.log(this.symbols.length);

        tween(this.reelProtect)
            .call(() => {
                if (this.isRolling === false) return;

                for (let s of this.symbols) {
                    s.reelIndex += 1;

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
            .call(() => { })
            .union()
            .repeatForever()
            .start();
    }


    stopRoll(result: any[]) {
        this.isRolling = false;
        this._isStopping = true;
        Tween.stopAllByTarget(this.reelProtect);

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
            s.rollToIndex(this._delay * 3.5, Symbol.MoveType.STOP);
        });
        GameManager.waitForSeconds(5 * this._delay)
        AudioManager.instance.ReelEnd()
        // SoundToggle.instance?.PlaySymbolDrop();
    }
    changeSpeed(newDelay: number) {
        this._delay = newDelay;
        Tween.stopAllByTarget(this.reelProtect);
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
        this.symbols.forEach(e => {
            if (e.face != SymbolType.SCRATCH) {
                e.node.setSiblingIndex(0)
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
        this.symbols = this.symbols.filter(s => s.node && s.node.isValid && !s.isDisposed);
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
        const createCount = space;
        for (let i = createCount - 1; i >= 0; i--) {
            let Symbol = this.createNewSymbol();
            Symbol.reelIndex = min + i;
            Symbol.node.setPosition(this.getSymbolPosition(Symbol.reelIndex - createCount));

            Symbol.reel = this;
            const data = aboveData[i] || { i: Math.floor(Math.random() * 8) + 2, t: "n" };
            Symbol.InitSymbol(data);

            Symbol.col = this.possitionReel;
            Symbol.row = i;
            GameManager.instance.symBolArray[Symbol.col][Symbol.row] = Symbol;
            newSymbols.push(Symbol);
        }
        for (let i = 0; i < existingSymbols.length; i++) {
            existingSymbols[i].DropToindex(0.1);
        }

        await GameManager.waitForSeconds(0.15);

        this.symbols.forEach(e => {
            e.shakeNode()
        })
        // delay tổng sau khi symbol cũ rơi xong
        await GameManager.waitForSeconds(0.15);

        for (let i = 0; i < newSymbols.length; i++) {
            this.symbols.push(newSymbols[i]);
            this.listSymbol.push(newSymbols[i].node)

            newSymbols[i].DropToindex(0.1);
        }
        await GameManager.waitForSeconds(0.15);
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