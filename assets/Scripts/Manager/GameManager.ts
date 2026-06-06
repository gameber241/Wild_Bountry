import { _decorator, Camera, Component, director, Node, Sprite, SpriteFrame, tween } from 'cc';
import { ReelBase } from '../Reels/ReelBase';
import { SymbolType } from '../Enum/ESymbolFace';
import { Symbol } from '../Reels/Symbol';
import { ListReel } from '../Reels/ListReel';
import { Spin } from '../Game/Spin';
import { MultiplierCarouselFinal } from '../Game/MultiplierAnimator';
import { TextBoxGame } from '../Game/TextBoxGame';
import { BigWin } from '../Game/BigWin';
import { FreeSpines } from '../Game/FreeSpines';
import { NetworkService } from '../Server/NetworkService';
import { UserInfo } from '../Server/UserInfo';
import { PanelBet } from '../Bet/PanelBet';
import { SymbolFrameState } from '../Enum/SymbolFrameState';
import { History } from '../Game/History';
import { InfSymbol } from '../Game/InfSymbol';
import { AudioManager } from '../Game/AudioManager';
import { GameConfig } from '../Server/GameConfig';
import sampleFreeSpinData from '../data_freespin.json';

const { ccclass, property } = _decorator;

export const currencyFormatSimple = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

type BetConfig = {
    bet: number;
    betSize: number;
    betLevel: number;
    betBase: number;
};

type GridCell = {
    i: number;
    f: number;
    [key: string]: any;
};

type GridPosition = {
    c: number;
    r: number;
    i?: number;
    [key: string]: any;
};

type RoundData = {
    grid: GridCell[][];
    above: GridCell[][];
    flips: GridPosition[];
    clear?: {
        normal?: GridPosition[];
        wild?: GridPosition[];
    };
    win: {
        normal?: GridPosition[];
        wild?: GridPosition[];
        positions: GridPosition[];
        ways: any[];
        stepWin: number;
        [key: string]: any;
    };
    baseWin?: number;
    multiplier: number;
    hasNext: boolean;
    [key: string]: any;
};

type SpinPayload = {
    rounds: RoundData[];
    batchSpins?: SpinPayload[];
    batchSummary?: {
        totalWin?: number;
        [key: string]: any;
    };
    [key: string]: any;
};

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null;

    @property({ type: ReelBase })
    public reels: ReelBase[] = [];

    @property(Camera)
    public cameraMain: Camera = null;

    @property(History)
    public his: History = null;

    @property(InfSymbol)
    public infSynbol: InfSymbol = null;

    @property(Sprite)
    public bgReels: Sprite = null;

    @property(SpriteFrame)
    public bgReelsSp1: SpriteFrame[] = [];

    @property(Node)
    public bgDown: Node = null;

    @property(Node)
    public bgUp: Node = null;

    @property(Node)
    public bgFreeSpin: Node = null;

    @property(Node)
    public walletNode: Node = null;

    @property(Node)
    public btnNode: Node = null;

    @property(Node)
    public uiFreewin: Node = null;

    @property(Node)
    public wayFree: Node = null;

    public stoppedCount = 0;
    public turboMode = 0;

    public betCurrent = 0;
    public betSizeCurrent = 0;
    public betLevelCurrent = 0;
    public betBaseCurrent = 0;

    public stepWin = 0;
    public stepWinCurrent = 0;
    public stepOld = 1;

    public sampleJson: SpinPayload = null;
    public dataFreespin: { payload: SpinPayload } | null = null;

    public indexCurrentReel = 0;
    public indexCurrentFreeSpin = 0;
    public totalFreeSpin = 0;
    public isFreeSpin = false;

    public isShowSetting = false;
    public isShowFooter = false;
    public priceOffset = 2000;
    public priceMax = 20000;

    public symBolArray: Symbol[][] = [];
    private otherHeight = 0;
    private balanceAfterBet: number | null = null;

    // ---------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------

    protected onLoad(): void {
        GameManager.instance = this;
        this.playFirstGameCameraAnim();
    }

    protected start(): void {
        this.bootstrapGame();
    }

    protected onDestroy(): void {
        if (GameManager.instance === this) {
            GameManager.instance = null;
        }
    }

    private bootstrapGame(): void {
        this.reels = ListReel.instance?.reels ?? this.reels;
        this.syncBetFromPanel();
        this.UpdateStepWIn(0);
        this.SetModeNormal();
        this.initGrid();
    }

    private playFirstGameCameraAnim(): void {
        if (!this.cameraMain) return;

        this.otherHeight = this.cameraMain.orthoHeight;
        this.cameraMain.orthoHeight = this.otherHeight + 100;

        tween(this.cameraMain)
            .delay(0.5)
            .to(1, { orthoHeight: this.otherHeight })
            .start();
    }

    private initGrid(): void {
        const cols = 7;
        this.symBolArray = [];

        for (let col = 0; col < cols; col++) {
            const rows = col === 0 ? 4 : 5;
            this.symBolArray[col] = Array.from({ length: rows }, () => null);
        }
    }

    // ---------------------------------------------------------------------
    // Public API kept for other components
    // ---------------------------------------------------------------------

    public UpdateBetCurrent(bet: number): void {
        this.betCurrent = bet;
        director.emit('BET_CURRENT', bet);
    }

    public UpdateBetConfig(betAmount: number, betSize: number, betLevel: number, betBase: number): void {
        this.betCurrent = betAmount;
        this.betSizeCurrent = betSize;
        this.betLevelCurrent = betLevel;
        this.betBaseCurrent = betBase;

        director.emit('BET_CURRENT', betAmount);
    }

    public UpdateStepWIn(stepWin: number): void {
        this.stepWin = stepWin;
        director.emit('UPDATE_STEPWIN', stepWin);
    }

    public async PlaySpin(): Promise<void> {
        const betConfig = this.getSpinBetConfig();
        let deductedDisplayBalance = false;

        if (!this.isFreeSpin && !GameConfig.spin.useSampleData) {
            this.balanceAfterBet = Number(UserInfo.getInstance().balance) - Number(betConfig.bet);
            deductedDisplayBalance = true;
            director.emit('UPDATE_BALLANCE', this.balanceAfterBet.toFixed(2));
        }

        try {
            const spinResult = GameConfig.spin.useSampleData
                ? sampleFreeSpinData
                : await NetworkService.getInstance().spin({
                    bet: betConfig.bet,
                    betSize: betConfig.betSize,
                    betLevel: betConfig.betLevel,
                });

            this.applySpinResult(spinResult);
        } catch (error) {
            console.error('[GameManager] Spin API error:', error);

            if (deductedDisplayBalance) {
                director.emit('UPDATE_BALLANCE', UserInfo.getInstance().balance);
                this.balanceAfterBet = null;
            }

            if (!this.isFreeSpin) {
                Spin.instance.ActiveSpin();
            }
            return;
        }

        this.SpinGame();
    }

    public SpinGame(): void {
        if (!this.hasValidCurrentRound()) {
            Spin.instance.ActiveSpin();
            return;
        }

        this.prepareSpinState();

        const round = this.getCurrentRound();
        this.SetModeNormal();
        this.GenerateMap(round.grid);
    }

    public GenerateMap(grid: GridCell[][]): void {
        if (this.CheckScratch()) {
            this.RollDataScratch(grid);
            return;
        }

        this.RollDataNormal(grid);
    }

    public async RollDataNormal(grid: GridCell[][]): Promise<void> {
        AudioManager.instance.ReelStart();

        for (let i = 0; i < this.reels.length; i++) {
            await GameManager.waitForSeconds(i === 0 ? 0 : this.GetTimeTurboStopSpin());
            this.reels[i].startRoll();
        }

        await GameManager.waitForSeconds(this.GetTimeTurboStopSpin() * 7);

        for (let i = 0; i < this.reels.length; i++) {
            this.reels[i].stopRoll(grid[i]);
            await GameManager.waitForSeconds(i === 0 ? 0 : this.GetTimeTurboStopSpin());
        }

        await GameManager.waitForSeconds(0.5);
        await this.ClearData();
    }

    public async RollDataScratch(grid: GridCell[][]): Promise<void> {
        try {
            AudioManager.instance.ReelStart();

            const firstScratchReelIndex = this.CheckReelFull3Scratch();

            if (firstScratchReelIndex < 0 || firstScratchReelIndex >= this.reels.length - 1) {
                await this.RollDataNormal(grid);
                return;
            }

            for (let i = 0; i < this.reels.length; i++) {
                this.reels[i].startRoll();
                await GameManager.waitForSeconds(i === 0 ? 0 : this.GetTimeTurboStopSpin());
            }

            await GameManager.waitForSeconds(this.GetTimeTurboStopSpin() * 7);

            for (let i = 0; i <= firstScratchReelIndex; i++) {
                this.reels[i].stopRoll(grid[i]);
                await GameManager.waitForSeconds(this.GetTimeTurboScratchStart());
            }

            this.playScratchIdleOnStoppedReels(firstScratchReelIndex);
            await this.stopScratchPhase2(firstScratchReelIndex, grid);
        } catch (error) {
            console.error('[GameManager] RollDataScratch error:', error);
            this.forceUnlockSpinAfterError();
        }
    }
    private forceUnlockSpinAfterError(): void {
        ListReel.instance?.HideMaskEffect?.();
        ListReel.instance?.HideVfxLight?.();

        if (this.cameraMain) {
            tween(this.cameraMain)
                .to(0.3, { orthoHeight: this.otherHeight })
                .start();
        }

        this.indexCurrentReel = 0;

        if (!this.isFreeSpin) {
            Spin.instance.ActiveSpin();
        }

        Spin.instance.isSpin = false;
    }
    public FlipData(): void {
        const flips = this.getCurrentRound()?.flips ?? [];

        flips.forEach(flip => {
            const symbol = this.resolveSymbolByPosition(flip.c, flip.r);
            if (!symbol) return;

            symbol.FlipSymbol(flip);
        });
    }

    public async ClearData(): Promise<void> {
        const round = this.getCurrentRound();
        if (!round) {
            this.finishCurrentSpin();
            return;
        }

        if (this.hasWin(round)) {
            console.log("den day")
            await this.playWinCascade(round);
        }

        if (round.hasNext) {
            this.indexCurrentReel++;
            await this.ClearData();
            return;
        }

        this.ShowBigWin();
    }

    public ShowBigWin(): void {
        const finishSpin = () => this.finishCurrentSpin();
        let index = 0;
        let winQueue: Array<() => void> = [];

        const runNext = () => {
            if (index >= winQueue.length) {
                finishSpin();
                return;
            }

            const fn = winQueue[index];
            index++;
            fn();
        };

        winQueue = this.createBigWinQueue(runNext);

        if (winQueue.length === 0) {
            finishSpin();
            return;
        }

        runNext();
    }
    CheckScratch(): boolean {
        const round = this.sampleJson?.rounds?.[this.indexCurrentReel];
        const grid = round?.grid;

        return this.countScratchInGrid(grid) >= 2;
    }

    public CheckReelFull3Scratch(): number {
        const round = this.sampleJson?.rounds?.[this.indexCurrentReel];
        const grid = round?.grid;

        if (!Array.isArray(grid)) {
            return -1;
        }

        for (let col = 0; col < grid.length; col++) {
            const column = grid[col];

            if (!Array.isArray(column)) continue;

            for (let row = 0; row < column.length; row++) {
                if (Number(column[row]?.i) === SymbolType.SCRATCH) {
                    return col;
                }
            }
        }

        return -1;
    }

    private hasFreeSpinData(): boolean {
        return Array.isArray(this.dataFreespin?.payload?.batchSpins)
            && this.dataFreespin.payload.batchSpins.length > 0;
    }
    public CheckScratch4(): boolean {
        return this.GetNumberScratch() >= 3;
    }

    public GetNumberScratch(): number {
        return this.reels.reduce((total, reel) => {
            const reelScratchCount = reel.symbols.filter(symbol => {
                if (!symbol) return false;
                if (!symbol.node?.isValid) return false;
                if (!symbol.node.active) return false;

                return symbol.face === SymbolType.SCRATCH;
            }).length;

            return total + reelScratchCount;
        }, 0);
    }
    public playAnimReelScratch(index: number): void {
        this.reels.forEach((reel, reelIndex) => {
            if (reel.spinesEff) {
                reel.spinesEff.enabled = reelIndex === index;
            }
        });
    }

    public ShowAllReef(iSpine = false): void {
        if (iSpine) return;

        this.reels.forEach(reel => {
            reel.symbols.forEach(symbol => {
                if (symbol.face === SymbolType.SCRATCH) {
                    symbol.playiconAnimation(symbol.getNameIdle(), true);
                }
            });
        });
    }

    public ShowAllScratch(index: number): void {
        this.reels.forEach((reel, reelIndex) => {
            if (reelIndex >= index) return;

            reel.symbols.forEach(symbol => {
                if (symbol.face === SymbolType.SCRATCH) {
                    symbol.node.setSiblingIndex(99);
                }
            });
        });
    }

    public removeWinDuplicateFlip(round: RoundData): void {
        if (!round?.win?.positions) return;

        const seen = new Set<string>();
        round.win.positions = round.win.positions.filter(position => {
            const key = `${position.c}_${position.r}`;
            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        });
    }

    public getFreeSpin(scratch: number): number {
        if (scratch < 3) return 0;

        this.totalFreeSpin += 10 + (scratch - 3) * 2;
        return this.totalFreeSpin;
    }

    public GetDataFreeSpin(): SpinPayload | null {
        const batchSpins = this.dataFreespin?.payload?.batchSpins ?? [];

        if (this.indexCurrentFreeSpin >= batchSpins.length) {
            return null;
        }

        return batchSpins[this.indexCurrentFreeSpin];
    }

    public PlayModeFreeSpin(): void {
        const dataFree = this.GetDataFreeSpin();

        if (!dataFree) {
            this.finishFreeSpinMode();
            return;
        }

        this.SetModeFreeSpin();
        this.indexCurrentReel = 0;
        this.indexCurrentFreeSpin++;
        this.totalFreeSpin--;
        this.isFreeSpin = true;

        TextBoxGame.instant.playRandomText();
        this.stepOld = 1;
        Spin.instance.isSpin = true;

        this.sampleJson = dataFree;
        FreeSpines.instance.UpdateFreeSpinLb(this.totalFreeSpin);
        this.GenerateMap(this.getCurrentRound().grid);
    }

    public SetModeNormal(): void {
        AudioManager.instance.PlaybgNormal();

        this.bgReels.spriteFrame = this.bgReelsSp1[0];
        this.bgReels.node.setPosition(0, 117, 0);
        this.bgDown.active = true;
        this.bgFreeSpin.active = false;
        this.walletNode.setPosition(21.22, -354);
        this.btnNode.active = true;
        this.bgUp.active = true;
        this.wayFree.active = false;
        this.uiFreewin.active = false;
    }

    public SetModeFreeSpin(): void {
        AudioManager.instance.PlaybgFree();

        this.bgReels.spriteFrame = this.bgReelsSp1[1];
        this.bgReels.node.setPosition(0, 41, 0);
        this.bgDown.active = false;
        this.bgFreeSpin.active = true;
        this.walletNode.setPosition(21.22, -596.327);
        this.btnNode.active = false;
        this.bgUp.active = false;
        this.wayFree.active = true;
        this.uiFreewin.active = true;
    }

    public extractBalanceFromPayload(payload: any): number | null {
        if (!payload) return null;

        const data = payload.data ? payload.data : payload;
        const wallets = Array.isArray(data.wallets) ? data.wallets : [];

        if (wallets[0]?.balance !== undefined) {
            return Number(wallets[0].balance);
        }

        if (data.user?.balance !== undefined) {
            return Number(data.user.balance);
        }

        if (data.balance !== undefined) {
            return Number(data.balance);
        }

        console.warn('[GameManager] No balance found in payload');
        return null;
    }

    // ---------------------------------------------------------------------
    // Spin data
    // ---------------------------------------------------------------------

    private syncBetFromPanel(): void {
        const panel = PanelBet.getInstance();
        if (!panel) return;

        this.UpdateBetConfig(panel.betAmount, panel.betSize, panel.betLevel, panel.betBetbase);
    }

    private getSpinBetConfig(): BetConfig {
        const hasInvalidBet = this.betCurrent <= 0
            || this.betSizeCurrent <= 0
            || this.betLevelCurrent <= 0
            || this.betBaseCurrent <= 0;

        if (hasInvalidBet) {
            this.syncBetFromPanel();
        }

        return {
            bet: this.betCurrent,
            betSize: this.betSizeCurrent,
            betLevel: this.betLevelCurrent,
            betBase: this.betBaseCurrent,
        };
    }

    private applySpinResult(spinResult: any): void {
        const payload = spinResult?.payload ?? spinResult?.data ?? spinResult ?? {};
        const normalizedPayload = this.normalizeSpinPayload(payload);

        this.sampleJson = normalizedPayload;
        this.dataFreespin = Array.isArray(normalizedPayload.batchSpins) && normalizedPayload.batchSpins.length > 0
            ? { payload: normalizedPayload }
            : null;

        this.indexCurrentReel = 0;
        this.indexCurrentFreeSpin = 0;
    }

    private normalizeSpinPayload(payload: any): SpinPayload {
        return {
            ...payload,
            rounds: Array.isArray(payload?.rounds)
                ? payload.rounds.map((round: any) => this.normalizeRound(round))
                : [],
            batchSpins: Array.isArray(payload?.batchSpins)
                ? payload.batchSpins.map((spin: any) => ({
                    ...spin,
                    rounds: Array.isArray(spin?.rounds)
                        ? spin.rounds.map((round: any) => this.normalizeRound(round))
                        : [],
                }))
                : [],
        };
    }

    private normalizeRound(round: any): RoundData {
        return {
            ...round,
            grid: this.normalizeGrid(round?.grid),
            above: this.normalizeGrid(round?.above),
            flips: Array.isArray(round?.flips) ? round.flips : [],
            clear: {
                normal: Array.isArray(round?.clear?.normal) ? round.clear.normal : [],
                wild: Array.isArray(round?.clear?.wild) ? round.clear.wild : [],
            },
            win: {
                ...(round?.win ?? {}),
                normal: Array.isArray(round?.win?.normal) ? round.win.normal : [],
                wild: Array.isArray(round?.win?.wild) ? round.win.wild : [],
                positions: Array.isArray(round?.win?.positions) ? round.win.positions : [],
                ways: Array.isArray(round?.win?.ways) ? round.win.ways : [],
                stepWin: Number(round?.win?.stepWin ?? 0),
            },
            multiplier: Number(round?.multiplier ?? 1),
            hasNext: !!round?.hasNext,
        };
    }

    private normalizeGrid(grid: any): GridCell[][] {
        if (!Array.isArray(grid)) return [];

        return grid.map((column: any) => {
            if (!Array.isArray(column)) return [];
            return column.map(cell => this.normalizeCell(cell));
        });
    }

    private normalizeCell(cell: any): GridCell {
        if (!cell || typeof cell !== 'object') {
            return cell;
        }

        return {
            ...cell,
            i: Number(cell.i ?? cell.face ?? cell.symbol ?? 0),
            f: Number(cell.f ?? SymbolFrameState.NORMAL),
        };
    }

    private hasValidCurrentRound(): boolean {
        return Array.isArray(this.sampleJson?.rounds)
            && this.sampleJson.rounds.length > 0
            && !!this.sampleJson.rounds[this.indexCurrentReel];
    }

    private getCurrentRound(): RoundData | null {
        return this.sampleJson?.rounds?.[this.indexCurrentReel] ?? null;
    }

    // ---------------------------------------------------------------------
    // Roll / scratch animation
    // ---------------------------------------------------------------------

    private async stopScratchPhase2(index: number, grid: GridCell[][]): Promise<void> {
        try {
            this.zoomCameraForScratch();
            TextBoxGame.instant.playScratch();

            for (let current = index + 1; current < this.reels.length; current++) {
                const reel = this.reels[current];

                if (!reel) {
                    continue;
                }

                AudioManager.instance.ReelSLow();
                reel.changeSpeed(0.1);

                ListReel.instance.ShowMaskEffect();
                this.ShowAllScratch(current);
                reel.ShowAllSymbol();
                ListReel.instance.ShowVfxLight(current);

                await GameManager.waitForSeconds(this.GetTimeTurboScratchSpin());

                reel._delay = 0.02;
                reel.stopRoll(grid[current] ?? []);

                ListReel.instance.HideVfxLight();

                await GameManager.waitForSeconds(1);
                reel.HideSymbolDifScratch();
            }

            await GameManager.waitForSeconds(0.4);
            this.ShowAllReef(true);

            await GameManager.waitForSeconds(1);
            await this.restoreCameraAfterScratch();

            ListReel.instance.HideMaskEffect();
            await this.ClearData();
        } catch (error) {
            console.error('[GameManager] stopScratchPhase2 error:', error);
            this.forceUnlockSpinAfterError();
        }
    }

    private playScratchIdleOnStoppedReels(lastReelIndex: number): void {
        for (let i = 0; i <= lastReelIndex; i++) {
            this.reels[i].symbols.forEach(symbol => {
                if (symbol.face === SymbolType.SCRATCH) {
                    symbol.PlayIdleScratch();
                }
            });
        }
    }

    private zoomCameraForScratch(): void {
        if (!this.cameraMain) return;

        tween(this.cameraMain)
            .to(1, { orthoHeight: this.otherHeight + 100 })
            .start();
    }

    private restoreCameraAfterScratch(): Promise<void> {
        if (!this.cameraMain) return Promise.resolve();

        return new Promise(resolve => {
            tween(this.cameraMain)
                .to(0.5, { orthoHeight: this.otherHeight })
                .call(() => resolve())
                .start();
        });
    }

    private prepareSpinState(): void {
        this.infSynbol?.hide();
        MultiplierCarouselFinal.instance.resetCombo();

        this.stepWinCurrent = 0;
        this.UpdateStepWIn(0);
        TextBoxGame.instant.playRandomText();
        this.stepOld = 1;
        Spin.instance.isSpin = true;
    }

    // ---------------------------------------------------------------------
    // Win / cascade
    // ---------------------------------------------------------------------

    private async playWinCascade(round: RoundData): Promise<void> {
        ListReel.instance.ShowMaskEffect();
        ListReel.instance.maskEffect.active = true;

        this.stepWinCurrent += Number(round.baseWin ?? round.win?.stepWin ?? 0);
        this.UpdateStepWIn(this.stepWinCurrent);
        this.removeWinDuplicateFlip(round);

        AudioManager.instance.Win();
        this.playFlipWinAnimation(round.flips);
        await this.disposeWinSymbols(round);

        this.stepOld = round.multiplier;
        MultiplierCarouselFinal.instance.focusTo(round.multiplier);
        TextBoxGame.instant.PlayStepWin(this.stepWinCurrent, this.stepOld);
        ListReel.instance.HideMaskEffect();

        if (round.flips.length > 0) {
            this.FlipData();
        }

        this.playWinSymbolAnimation(round);
        await this.dropCascadeSymbols(round);
        await GameManager.waitForSeconds(1);
    }

    private hasWin(round: RoundData): boolean {
        console.log(round)
        const normalWin = round.win?.normal?.length ?? 0;
        const wildWin = round.win?.wild?.length ?? 0;
        return normalWin > 0 || wildWin > 0;
    }

    private playFlipWinAnimation(flips: GridPosition[]): void {
        flips.forEach(flip => {
            const symbol = this.resolveSymbolByPosition(flip.c, flip.r);
            if (!symbol) return;

            symbol.node.setSiblingIndex(100);
            symbol.playiconAnimation(symbol.getNameWin(), false);
        });
    }

    private async disposeWinSymbols(round: RoundData): Promise<void> {
        const toClear = [
            ...(round.clear?.normal ?? []),
            ...(round.clear?.wild ?? []),
        ];
        const disposeTasks: Promise<void>[] = [];

        for (const clearItem of toClear) {
            const symbol = this.resolveSymbolByPosition(clearItem.c, clearItem.r, clearItem.i);
            if (!symbol) continue;

            await GameManager.waitForSeconds(0.07);
            disposeTasks.push(symbol.Dispose());
        }

        await Promise.all(disposeTasks);
    }

    private playWinSymbolAnimation(round: RoundData): void {
        const allWin = [
            ...(round.win?.normal ?? []),
            ...(round.win?.wild ?? []),
        ];

        allWin.forEach(position => {
            const symbol = this.resolveSymbolByPosition(position.c, position.r, position.i);
            if (symbol) {
                symbol.AnimationWin();
            }
        });
    }

    private async dropCascadeSymbols(round: RoundData): Promise<void> {
        const tasks: Promise<void>[] = [];

        for (let i = 0; i < this.reels.length; i++) {
            if (round.above[i]?.length > 0) {
                tasks.push(this.reels[i].cascadeDrop(round.above[i]));
            }
        }

        await Promise.all(tasks);
    }

    private resolveSymbolByPosition(c: number, r: number, expectedFace?: number): Symbol | null {
        const reel = this.reels[c];
        if (!reel) return null;

        const byRow = reel.symbols?.find(symbol => {
            if (!symbol?.node?.isValid || !symbol.node.active) return false;
            if (symbol.row !== r) return false;
            if (expectedFace !== undefined && symbol.face !== expectedFace) return false;

            return true;
        }) as Symbol;

        if (byRow) {
            if (!this.symBolArray[c]) this.symBolArray[c] = [];
            this.symBolArray[c][r] = byRow;
            return byRow;
        }

        return this.symBolArray[c]?.[r] ?? null;
    }

    private createBigWinQueue(onDone: () => void): Array<() => void> {
        const queue: Array<() => void> = [];
        const totalWin = this.stepWinCurrent;
        const bet = this.betCurrent;

        if (totalWin > 10 * bet) {
            const step = totalWin < 15 * bet ? totalWin : 10 * bet;
            queue.push(() => {
                AudioManager.instance.PlayBigwin();
                BigWin.instance.showBigWin(onDone, step);
            });
        }

        if (totalWin > 15 * bet) {
            const step = totalWin < 25 * bet ? totalWin : 10 * bet;
            queue.push(() => {
                AudioManager.instance.PlaySupperwin();
                BigWin.instance.showSuperWin(onDone, step);
            });
        }

        if (totalWin > 25 * bet) {
            queue.push(() => {
                AudioManager.instance.PlayMegaWin();
                BigWin.instance.showMegaWin(onDone, totalWin);
            });
        }

        return queue;
    }

    private finishCurrentSpin(): void {
        this.applyBalanceAfterSpinEnd();

        if (this.CheckScratch4()) {
            if (this.hasFreeSpinData()) {
                this.startFreeSpinFromScratch();
                return;
            }

            console.warn('[GameManager] Có đủ scratch trên reel nhưng không có batchSpins. Bỏ qua free spin để tránh đơ game.');
        }

        if (this.isFreeSpin) {
            this.indexCurrentReel = 0;
            this.PlayModeFreeSpin();
            return;
        }

        this.finishNormalSpin();
    }

    private finishNormalSpin(): void {
        this.indexCurrentReel = 0;
        this.SetModeNormal();

        if (Spin.instance.isAuto) {
            Spin.instance.AutoSpinNext();
            return;
        }

        Spin.instance.isSpin = false;
    }

    private startFreeSpinFromScratch(): void {
        this.indexCurrentReel = 0;
        this.isFreeSpin = true;

        const freeSpinCount = this.getFreeSpin(this.GetNumberScratch());
        FreeSpines.instance.playAnimation(freeSpinCount);
        FreeSpines.instance.UpdateFreeSpinLb(freeSpinCount);
    }

    private finishFreeSpinMode(): void {
        AudioManager.instance.PlayTotalWIn();

        const totalWin = this.dataFreespin?.payload?.batchSummary?.totalWin ?? 0;
        FreeSpines.instance.ShowTotalSpin(() => {
            this.indexCurrentFreeSpin = 0;
            this.indexCurrentReel = 0;
            this.isFreeSpin = false;
            this.totalFreeSpin = 0;
            this.dataFreespin = null;

            Spin.instance.ActiveSpin();
            this.SetModeNormal();

            if (Spin.instance.isAuto) {
                Spin.instance.AutoSpinNext();
                return;
            }

            Spin.instance.isSpin = false;
        }, totalWin);
    }

    private applyBalanceAfterSpinEnd(): void {
        if (this.balanceAfterBet === null) return;

        const finalBalance = Number(this.balanceAfterBet) + Number(this.stepWinCurrent);
        UserInfo.getInstance().updateBalance(finalBalance);
        this.balanceAfterBet = null;
    }

    // ---------------------------------------------------------------------
    // Scratch helper
    // ---------------------------------------------------------------------

    private countScratchInGrid(grid: any[][]): number {
        if (!Array.isArray(grid)) return 0;

        let count = 0;

        grid.forEach(column => {
            if (!Array.isArray(column)) return;

            column.forEach(cell => {
                if (Number(cell?.i) === SymbolType.SCRATCH) {
                    count++;
                }
            });
        });

        return count;
    }

    // ---------------------------------------------------------------------
    // Turbo timing
    // ---------------------------------------------------------------------

    public GetTimeTurboStarSpin(): number {
        if (this.turboMode === 0) return 0.75;
        if (this.turboMode === 1) return 0.25;
        return 0;
    }

    public GetTimeTurboScratchStart(): number {
        if (this.turboMode === 0) return 0.2;
        return 0;
    }

    public GetTimeTurboStopSpin(): number {
        if (this.turboMode === 0) return 0.1;
        return 0;
    }

    public GetTimeTurboScratchSpin(): number {
        if (this.turboMode === 0) return 3;
        return 0;
    }

    public static waitForSeconds(seconds: number): Promise<void> {
        const tempObj = { value: 0 };

        return new Promise(resolve => {
            tween(tempObj)
                .delay(seconds)
                .call(() => resolve())
                .start();
        });
    }
}
