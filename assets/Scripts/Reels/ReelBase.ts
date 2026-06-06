import { _decorator, UITransform, Vec3, Tween, tween, instantiate, Node, sp, Layers } from 'cc';
import { Symbol } from './Symbol';
import { PrefabManager } from '../Manager/PrefabManager';
import { GameManager } from '../Manager/GameManager';
import { SymbolType } from '../Enum/ESymbolFace';
import { AudioManager } from '../Game/AudioManager';

const { ccclass, property } = _decorator;

@ccclass('ReelBase')
export abstract class ReelBase {
    @property(sp.Skeleton)
    spinesEff: sp.Skeleton = null!;

    public symbolPadding = 1.5;
    public symbols: Symbol[] = [];

    protected cellSize = 0;
    protected totalSize = 0;
    protected halfSize = 0;

    /**
     * Delay hiện tại đang chạy.
     * Khi start spin, delay này sẽ được đẩy chậm lên rồi tự giảm dần về _targetDelay.
     */
    _delay = 0.02;

    /**
     * Delay mục tiêu. changeSpeed chỉ đổi biến này, không startRoll lại.
     */
    private _targetDelay = 0.02;

    /**
     * Token để hủy các tween loop cũ.
     */
    private _spinToken = 0;

    protected _isStopping = false;
    protected _remainSteps = 0;

    @property(Number)
    possitionReel: number = 0;

    isRolling = false;

    @property(Number)
    numberSymbols: number = 9;

    reelProtect: Node = null!;

    public abstract VISIBLE_COUNT: number;
    public abstract FIRST_VISIBLE: number;

    reelNode: Node = null!;
    listSymbol: Node[] = [];

    init(reelNode: Node) {
        this.reelNode = reelNode;

        for (let i = 0; i < this.numberSymbols; i++) {
            const symbol = instantiate(PrefabManager.instance.symbolPrefab);
            reelNode.addChild(symbol);
            this.listSymbol.push(symbol);
        }

        this.collectSymbols();
        this.rearrangeSymbols();

        this._targetDelay = this._delay;
    }

    protected collectSymbols() {
        this.symbols = [];

        for (const n of this.listSymbol) {
            const s = n.getComponent(Symbol);

            if (s) {
                s.reel = this;
                s.reelIndex = this.symbols.length;
                this.symbols.push(s);
                s.ResetSymbol();
            }
        }

        if (this.symbols.length > 0) {
            const ui = this.symbols[0].node.getComponent(UITransform);
            this.cellSize = this.getCellSize(ui) + this.symbolPadding;
            this.totalSize = this.cellSize * this.symbols.length;
            this.computeHalfSize();
        }
    }

    protected rearrangeSymbols() {
        for (const s of this.symbols) {
            if (!s || !s.node || !s.node.isValid) continue;
            s.node.position = this.getSymbolPosition(s.reelIndex);
        }
    }

    private normalizeSymbolCount() {
        this.listSymbol = this.listSymbol.filter(node => node && node.isValid);
        this.symbols = this.symbols.filter(symbol => symbol && symbol.node && symbol.node.isValid);

        this.symbols = [];

        for (const node of this.listSymbol) {
            const symbol = node.getComponent(Symbol);

            if (symbol) {
                symbol.reel = this;
                this.symbols.push(symbol);
            }
        }

        while (this.symbols.length < this.numberSymbols) {
            const symbol = this.createNewSymbol();

            symbol.reel = this;
            symbol.reelIndex = this.symbols.length;
            symbol.ResetSymbol();

            symbol.node.setPosition(this.getSymbolPosition(-1));
            symbol.node.active = true;

            this.listSymbol.push(symbol.node);
            this.symbols.push(symbol);

            console.warn(`➕ Added missing symbol: ${this.symbols.length}/${this.numberSymbols}`);
        }

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

            console.warn(`➖ Removed extra symbol: ${this.symbols.length}/${this.numberSymbols}`);
        }

        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            symbol.reel = this;
            symbol.reelIndex = i;
        }

        if (this.symbols.length > 0) {
            const ui = this.symbols[0].node.getComponent(UITransform);
            this.cellSize = this.getCellSize(ui) + this.symbolPadding;
            this.totalSize = this.cellSize * this.symbols.length;
            this.computeHalfSize();
        }

        console.log(`✅ Reel ${this.possitionReel}: ${this.symbols.length}/${this.numberSymbols}`);
    }

    startRoll() {
        if (this.isRolling) return;

        this._isStopping = false;
        this.isRolling = true;

        const token = ++this._spinToken;

        /**
         * Lưu tốc độ thật làm target.
         * Sau đó set _delay chậm hơn để đoạn đầu có cảm giác tăng tốc.
         */
        const realTargetDelay = this._delay;
        this._targetDelay = realTargetDelay;
        this._delay = Math.max(realTargetDelay * 3, 0.06);

        /**
         * Không normalize/rearrange mỗi lần spin nếu số lượng không sai,
         * vì sẽ làm spin lần 2 bị nhảy symbol.
         */
        if (
            this.symbols.length !== this.numberSymbols ||
            this.listSymbol.length !== this.numberSymbols
        ) {
            this.normalizeSymbolCount();
            this.rearrangeSymbols();
        }

        this.symbols.forEach(e => {
            if (!e || !e.node || !e.node.isValid) return;

            e.icon.node.layer = Layers.Enum.DEFAULT;
            e.frame.node.layer = Layers.Enum.DEFAULT;

            /**
             * Không reset symbol ở đây.
             * Symbol chỉ random lại khi nó recycle ra ngoài màn hình.
             */
            e.isInit = false;
            e.node.active = true;
            e.node.setSiblingIndex(1);

            Tween.stopAllByTarget(e.node);
        });

        Tween.stopAllByTarget(this.reelProtect);

        /**
         * START chỉ nhích lên nhẹ, không đổi index, không đổi UI move toàn bộ.
         */
        const startBackTime = 0.05;
        const startReturnTime = 0.10;
        const startTotalTime = startBackTime + startReturnTime;

        tween(this.reelProtect)
            .call(() => {
                if (!this.isRolling || token !== this._spinToken) return;

                for (const s of this.symbols) {
                    if (!s || !s.node || !s.node.isValid) continue;

                    s.rollToIndex(startReturnTime, Symbol.MoveType.START, false);
                }
            })
            .delay(startTotalTime)
            .call(() => {
                if (!this.isRolling || token !== this._spinToken) return;

                this.startMoveLoop(token);
            })
            .start();
    }

    private getSmoothDelay(): number {
        /**
         * Càng lớn thì đổi tốc càng nhanh.
         * 0.18 - 0.25 là ổn.
         */
        const smooth = 0.22;

        this._delay += (this._targetDelay - this._delay) * smooth;

        if (Math.abs(this._delay - this._targetDelay) < 0.001) {
            this._delay = this._targetDelay;
        }

        return this._delay;
    }

    private moveOneStep(time: number, type: string) {
        if (!this.isRolling && type !== Symbol.MoveType.STOP) return;

        for (const s of this.symbols) {
            if (!s || !s.node || !s.node.isValid) continue;

            const oldIndex = s.reelIndex;

            s.reelIndex += 1;

            let wasRecycled = false;

            if (s.reelIndex >= this.symbols.length) {
                s.reelIndex = 0;
                wasRecycled = true;

                if (!this._isStopping) {
                    s.ResetSymbol();
                }

                /**
                 * Đưa symbol vừa đi khỏi dưới lên phía trên ngoài màn hình.
                 */
                s.node.setPosition(this.getSymbolPosition(-1));
            }

            const useMoveVisual = this.shouldUseMoveVisual(
                oldIndex,
                s.reelIndex,
                wasRecycled
            );

            s.rollToIndex(time, type, useMoveVisual);
        }
    }

    startMoveLoop(token: number = this._spinToken) {
        if (!this.isRolling || this._isStopping || token !== this._spinToken) return;

        Tween.stopAllByTarget(this.reelProtect);

        /**
         * Tính delay trước khi tạo tween.
         * Không dùng repeatForever vì repeatForever giữ delay cũ, đổi speed sẽ bị giật.
         */
        const moveTime = this.getSmoothDelay();

        tween(this.reelProtect)
            .call(() => {
                if (!this.isRolling || this._isStopping || token !== this._spinToken) return;

                this.moveOneStep(moveTime, Symbol.MoveType.MOVING);
            })
            .delay(moveTime)
            .call(() => {
                if (!this.isRolling || this._isStopping || token !== this._spinToken) return;

                this.startMoveLoop(token);
            })
            .start();
    }

    private isVisibleIndex(index: number): boolean {
        const total = this.symbols.length;

        if (total <= 0) return false;

        const normalizedIndex = ((index % total) + total) % total;

        for (let i = 0; i < this.VISIBLE_COUNT; i++) {
            const visibleIndex = (this.FIRST_VISIBLE + i) % total;

            if (normalizedIndex === visibleIndex) {
                return true;
            }
        }

        return false;
    }

    private shouldUseMoveVisual(oldIndex: number, newIndex: number, wasRecycled: boolean): boolean {
        if (wasRecycled) return true;

        const oldVisible = this.isVisibleIndex(oldIndex);
        const newVisible = this.isVisibleIndex(newIndex);

        /**
         * Symbol ở ngoài màn hình hoặc vừa rời khỏi màn hình mới chuyển move.
         * Symbol đang visible thì giữ idle để không bị đổi cả reel lúc start.
         */
        if (!oldVisible && !newVisible) return true;
        if (oldVisible && !newVisible) return true;

        return false;
    }

    async stopRoll(result: any[]) {
        if (this._isStopping) return;

        this._isStopping = true;

        const token = ++this._spinToken;

        /**
         * Cho chạy thêm một nhịp rất nhỏ để không dừng cụt.
         */
        await GameManager.waitForSeconds(Math.max(this._delay, 0.02));

        if (token !== this._spinToken) return;

        this.isRolling = false;

        Tween.stopAllByTarget(this.reelProtect);

        for (const s of this.symbols) {
            if (s?.node?.isValid) {
                Tween.stopAllByTarget(s.node);
            }
        }

        const total = this.symbols.length;
        const visible = this.VISIBLE_COUNT;
        const firstVisible = this.FIRST_VISIBLE;

        this.symbols.sort((a, b) => a.reelIndex - b.reelIndex);

        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].reelIndex = i;
        }

        const indexMap = new Map<number, Symbol>();

        for (const sym of this.symbols) {
            indexMap.set(sym.reelIndex, sym);
        }

        /**
         * Gán result vào các symbol chuẩn bị rơi vào vùng visible.
         */
        for (let i = 0; i < visible; i++) {
            const targetIndex = (firstVisible + i) % total;
            const placeIndex = (targetIndex - visible + total) % total;

            let s = indexMap.get(placeIndex);

            if (!s) {
                console.warn("⚠ Missing symbol at index:", placeIndex);
                s = this.symbols[i % this.symbols.length];
            }

            s.InitSymbol(result[i]);
            s.col = this.possitionReel;
            s.row = i;

            if (GameManager.instance?.symBolArray) {
                GameManager.instance.symBolArray[s.col][s.row] = s;
            }
        }

        const stopTime = Math.max(this._targetDelay * 8, 0.22);

        for (const s of this.symbols) {
            if (!s || !s.node || !s.node.isValid) continue;

            s.reelIndex += visible;

            /**
             * STOP không bắt tất cả chuyển move.
             * Chỉ symbol ngoài visible mới dùng move visual.
             */
            const useMoveVisual = !this.isVisibleIndex(s.reelIndex);

            s.rollToIndex(stopTime, Symbol.MoveType.STOP, useMoveVisual);
        }

        await GameManager.waitForSeconds(stopTime + 0.12);

        if (token !== this._spinToken) return;

        AudioManager.instance.ReelEnd();
    }

    changeSpeed(newDelay: number) {
        /**
         * Không gọi startRoll ở đây.
         * Không stop tween ở đây.
         * Chỉ đổi target delay để loop tự chuyển tốc mượt.
         */
        this._targetDelay = Math.max(newDelay, 0.01);

        if (!this.isRolling) {
            this._delay = this._targetDelay;
        }
    }

    ShowAllSymbol() {
        this.listSymbol.forEach(e => {
            if (!e || !e.isValid) return;

            e.setSiblingIndex(91);

            const symbol = e.getComponent(Symbol);

            if (!symbol) return;

            if (symbol.face === SymbolType.SCRATCH || symbol.face === SymbolType.WILD) {
                e.setSiblingIndex(92);
            }
        });
    }

    HideSymbolDifScratch() {
        this.symbols.forEach(e => {
            if (!e || !e.node || !e.node.isValid) return;

            if (e.face !== SymbolType.SCRATCH) {
                e.node.setSiblingIndex(0);
            }
        });
    }

    public async cascadeDrop(dataAbove: any[]) {
        const aboveData = this.isHorizontal() ? dataAbove : [...dataAbove].reverse();

        this.symbols = this.symbols.filter(s => s.node && s.node.isValid && !s.isDisposed);

        let space = 0;
        const min = this.VISIBLE_COUNT;
        const max = min * 2 - 1;

        const existingSymbols: Symbol[] = [];
        const newSymbols: Symbol[] = [];

        for (let i = max; i >= min; i--) {
            const s = this.symbols.find(e => e.reelIndex === i);

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
            const symbol = this.createNewSymbol();

            symbol.reelIndex = min + i;
            symbol.node.setPosition(this.getSymbolPosition(symbol.reelIndex - createCount));

            symbol.reel = this;

            const data = aboveData[i] || {
                i: Math.floor(Math.random() * 8) + 2,
                t: "n"
            };

            symbol.InitSymbol(data);

            symbol.col = this.possitionReel;
            symbol.row = i;

            GameManager.instance.symBolArray[symbol.col][symbol.row] = symbol;

            newSymbols.push(symbol);
        }

        for (let i = 0; i < existingSymbols.length; i++) {
            existingSymbols[i].DropToindex(0.1);
        }

        await GameManager.waitForSeconds(0.15);

        this.symbols.forEach(e => {
            e.shakeNode();
        });

        await GameManager.waitForSeconds(0.15);

        for (let i = 0; i < newSymbols.length; i++) {
            this.symbols.push(newSymbols[i]);
            this.listSymbol.push(newSymbols[i].node);

            newSymbols[i].DropToindex(0.1);
        }

        await GameManager.waitForSeconds(0.15);
    }

    private createNewSymbol(): Symbol {
        const symbol = instantiate(PrefabManager.instance.symbolPrefab);
        this.reelNode.addChild(symbol);

        return symbol.getComponent(Symbol)!;
    }

    public isHorizontal(): boolean {
        return false;
    }

    public abstract getCellSize(ui: UITransform): number;
    public abstract computeHalfSize(): void;
    public abstract getSymbolPosition(index: number): Vec3;
    public abstract sortSibling(): void;
}