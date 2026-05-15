import { _decorator, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3, director, resources, JsonAsset, Camera } from 'cc';
import { ReelBase } from '../Reels/ReelBase';
import { SymbolType } from '../Enum/ESymbolFace';
import { Symbol } from '../Reels/Symbol';
import { ListReel } from '../Reels/ListReel';
import { Spin } from '../Game/Spin';
import { MultiplierCarouselFinal } from '../Game/MultiplierAnimator';
import { TextBoxGame } from '../Game/TextBoxGame';
import { BigWin } from '../Game/BigWin';
import { FreeSpines } from '../Game/FreeSpines';
import { AuthService } from '../Server/AuthService';
import { NetworkService } from '../Server/NetworkService';
import { UserInfo } from '../Server/UserInfo';
import { PanelBet } from '../Bet/PanelBet';
import { SymbolFrameState } from '../Enum/SymbolFrameState';
import { History } from '../Game/History';
import { InfSymbol } from '../Game/InfSymbol';

export const currencyFormatSimple = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const waitForSeconds = (s: number): Promise<void> => {
    // Dùng tween thay vì setTimeout để đồng bộ với engine game loop
    const tempObj = { v: 0 };
    return new Promise(resolve => {
        tween(tempObj)
            .delay(s)
            .call(() => resolve())
            .start();
    });
}
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: ReelBase })
    reels: ReelBase[] = []

    public static instance: GameManager = null

    public stoppedCount = 0

    @property(Camera)
    cameraMain: Camera = null;

    @property(History)
    his: History = null

    @property(InfSymbol)
    infSynbol: InfSymbol = null;


    turboMode = 0
    //data Freespin
    dataFreespin: any = null
    otherHeight = 0
    AnimFirstGame() {
        this.otherHeight = this.cameraMain.orthoHeight
        this.cameraMain.orthoHeight = this.otherHeight + 100
        tween(this.cameraMain)
            .delay(0.5)
            .to(1, { orthoHeight: this.otherHeight }).start()
    }


    onLoad() {
        this.AnimFirstGame()
        GameManager.instance = this
        // Listen to profile updates
        // EventBus.getInstance().on('profile:updated', this.onProfileUpdated, this);
    }
    protected start(): void {
        void this.bootstrapGame();
    }

    private async bootstrapGame(): Promise<void> {
        try {
            await AuthService.ensureAuthenticated();
        } catch (error) {
            console.error('[GameManager] Auto login error:', error);
        }

        this.syncBetFromPanel();
        this.UpdateStepWIn(0)
        this.SetModeNormal()
        this.initGrid()
        this.reels = ListReel.instance.reels
    }

    betCurrent: number = 0
    betSizeCurrent: number = 0
    betLevelCurrent: number = 0
    betBaseCurrent: number = 0
    stepWin: number = 0
    UpdateBetCurrent(bet: number) {
        this.betCurrent = bet
        director.emit("BET_CURRENT", bet)
    }

    UpdateBetConfig(betAmount: number, betSize: number, betLevel: number, betBase: number) {
        this.betCurrent = betAmount
        this.betSizeCurrent = betSize
        this.betLevelCurrent = betLevel
        this.betBaseCurrent = betBase
        director.emit("BET_CURRENT", betAmount)
    }

    private syncBetFromPanel(): void {
        // const panel = PanelBet.instance; 
        const panel = PanelBet.getInstance();
        if (!panel) {
            return;
        }
        console.log(panel.betAmount)
        this.UpdateBetConfig(panel.betAmount, panel.betSize, panel.betLevel, panel.betBetbase);
    }

    private getSpinBetConfig() {
        if (this.betCurrent <= 0 || this.betSizeCurrent <= 0 || this.betLevelCurrent <= 0 || this.betBaseCurrent <= 0) {
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
        this.dataFreespin = Array.isArray(normalizedPayload.batchSpins)
            ? { payload: normalizedPayload }
            : null;
        this.indexCurrentReel = 0;
        this.indexCurrentFreeSpin = 0;
    }

    private normalizeSpinPayload(payload: any) {
        return {
            ...payload,
            rounds: Array.isArray(payload?.rounds)
                ? payload.rounds.map((round) => this.normalizeRound(round))
                : [],
            batchSpins: Array.isArray(payload?.batchSpins)
                ? payload.batchSpins.map((spin) => ({
                    ...spin,
                    rounds: Array.isArray(spin?.rounds)
                        ? spin.rounds.map((round) => this.normalizeRound(round))
                        : [],
                }))
                : [],
        };
    }

    private normalizeRound(round: any) {
        return {
            ...round,
            grid: Array.isArray(round?.grid)
                ? round.grid.map((column) => Array.isArray(column)
                    ? column.map((cell) => this.normalizeCell(cell))
                    : [])
                : [],
            above: Array.isArray(round?.above)
                ? round.above.map((column) => Array.isArray(column)
                    ? column.map((cell) => this.normalizeCell(cell))
                    : [])
                : [],
            flips: Array.isArray(round?.flips) ? round.flips : [],
            win: {
                ...(round?.win ?? {}),
                positions: Array.isArray(round?.win?.positions) ? round.win.positions : [],
                ways: Array.isArray(round?.win?.ways) ? round.win.ways : [],
                stepWin: Number(round?.win?.stepWin ?? 0),
            },
            multiplier: Number(round?.multiplier ?? 1),
            hasNext: !!round?.hasNext,
        };
    }

    private normalizeCell(cell: any) {
        if (!cell || typeof cell !== 'object') {
            return cell;
        }

        return {
            ...cell,
            i: Number(cell.i ?? cell.face ?? cell.symbol ?? 0),
            f: Number(cell.f ?? SymbolFrameState.NORMAL),
        };
    }

    extractBalanceFromPayload(payload: any): number | null {

        if (!payload) {
            return null;
        }

        const data = payload.data ? payload.data : payload;
        // Check wallets array first
        const wallets = Array.isArray(data.wallets) ? data.wallets : [];

        if (wallets.length > 0 && wallets[0] && wallets[0].balance !== undefined) {
            return Number(wallets[0].balance);
        }

        // Check user.balance
        if (data.user && data.user.balance !== undefined) {
            return Number(data.user.balance);
        }

        // Check direct balance
        if (data.balance !== undefined) {
            return Number(data.balance);
        }

        console.warn('[GameManager] No balance found in payload');
        return null;
    }


    protected onDestroy(): void {
        // EventBus.getInstance().off('profile:updated', this.onProfileUpdated);
    }



    symBolArray: Symbol[][]

    initGrid() {
        const cols = 7
        this.symBolArray = []
        for (let col = 0; col < cols; col++) {
            const rows = (col == 0) ? 4 : 5
            this.symBolArray[col] = Array.from(
                { length: rows },
                () => null
            )
        }
    }

    sampleJson = null;

    indexCurrentReel = 0
    public async PlaySpin() {
        try {
            const betConfig = this.getSpinBetConfig();
            const spinResult = await NetworkService.getInstance().spin({
                bet: betConfig.bet,
                betSize: betConfig.betSize,
                betLevel: betConfig.betLevel,
            });

            this.applySpinResult(spinResult);

            try {
                const profile = await NetworkService.getInstance().getProfile();
                UserInfo.getInstance().updateProfile(profile);
            } catch (profileError) {
                console.warn('[GameManager] Refresh profile after spin failed:', profileError);
            }
        } catch (error) {
            console.error('[GameManager] Spin API error:', error);
            if (this.isFreeSpin == true) return
            Spin.instance.ActiveSpin();
            return;
        }

        this.SpinGame()
    }

    stepOld = 1
    SpinGame() {
        if (!this.sampleJson || !Array.isArray(this.sampleJson.rounds) || this.sampleJson.rounds.length === 0) {
            console.error('[GameManager] Missing spin result');
            Spin.instance.ActiveSpin();
            return;
        }

        this.infSynbol.hide()
        MultiplierCarouselFinal.instance.resetCombo()
        this.stepWinCurrent = 0
        this.UpdateStepWIn(0)
        // TextBoxCombo.instant.playRandomText()
        this.stepOld = 1
        Spin.instance.isSpin = true
        // Waymanager.instance.resetWay()
        const round = this.sampleJson.rounds[this.indexCurrentReel];
        console.log(round)
        this.SetModeNormal();
        const grid = round.grid;
        this.GenerateMap(grid);
    }

    UpdateStepWIn(stepWin) {
        this.stepWin = stepWin
        director.emit("UPDATE_STEPWIN", stepWin)

    }
    GenerateMap(grid: any[][]) {
        if (this.CheckScratch() == false)
            this.RollDataNormal(grid)
        else {
            this.RollDataScratch(grid)

        }
    }

    async RollDataScratch(grid) {
        const indexReel = this.CheckReelFull3Scratch();
        if (indexReel === this.reels.length - 1) {
            this.RollDataNormal(grid);
            return;
        }
        for (let i = 0; i < this.reels.length; i++) {
            let current = i;
            this.reels[current].startRoll();
        }
        await GameManager.waitForSeconds(this.GetTimeTurboScratchStart());


        let stopped = 0;
        const phase1 = indexReel + 1
        for (let i = 0; i <= indexReel; i++) {
            this.reels[i].stopRoll(grid[i])
            await GameManager.waitForSeconds(this.GetTimeTurboScratchStart());

            if (++stopped !== phase1) continue;
            this.stopPhase2(indexReel, grid);
            for (let j = 0; j <= indexReel; j++)
                this.reels[j].symbols
                    .forEach(e => {
                        if (e.face === SymbolType.SCRATCH)
                            e.PlayIdleScratch();
                    });
            return


        }
    }

    private async stopPhase2(index: number, grid: any[]) {
        tween(this.cameraMain).to(1, { orthoHeight: this.otherHeight + 100 })
            .call(async () => {

            })
            .start()

        TextBoxGame.instant.playScratch()
        let current = index + 1;

        while (current < this.reels.length) {
            const reel = this.reels[current];
            reel.changeSpeed(0.2)
            ListReel.instance.ShowMaskEffect()
            this.ShowAllScratch(current)
            reel.ShowAllSymbol()
            ListReel.instance.ShowVfxLight(current)
            await GameManager.waitForSeconds(this.GetTimeTurboScratchSpin());
            reel._delay = 0.06
            reel.stopRoll(grid[current]);
            ListReel.instance.HideVfxLight()
            await GameManager.waitForSeconds(1);
            reel.HideSymbolDifScratch()

            current++;
        }

        // Khi stop hết reel
        // this.playAnimReelScratch(99);
        this.scheduleOnce(() => {
            this.ShowAllReef(true)
            this.scheduleOnce(() => {
                tween(this.cameraMain).to(0.5, { orthoHeight: this.otherHeight })
                    .call(() => {
                        ListReel.instance.HideMaskEffect()
                        this.ClearData()
                    })
                    .start()
            }, 1)

        }, 0.4)

    }

    async RollDataNormal(grid) {
        for (let i = 0; i < this.reels.length; i++) {
            let current = i;
            await GameManager.waitForSeconds(i == 0 ? 0 : this.GetTimeTurboStopSpin());
            this.reels[current].startRoll();
        }

        await GameManager.waitForSeconds(0.16);

        for (let i = 0; i < this.reels.length; i++) {
            let current = i;
            this.reels[current].stopRoll(grid[i]);
            await GameManager.waitForSeconds(i == 0 ? 0 : this.GetTimeTurboStopSpin());
        }
        await GameManager.waitForSeconds(0.5);
        this.ClearData()


    }


    private resolveSymbolByPosition(c: number, r: number, expectedFace?: number) {
        const byGrid = this.symBolArray[c][r] as Symbol;

        const reel = this.reels[c];
        const byRow = reel?.symbols?.find(s => s?.node?.isValid && s.row === r) as Symbol;
        if (byRow && (expectedFace === undefined || byRow.face === expectedFace)) {
            this.symBolArray[c][r] = byRow;
            return byRow;
        }

        return null;
    }

    FlipData() {
        let dataRound = this.sampleJson.rounds[this.indexCurrentReel].win.wild;
        this.scheduleOnce(() => {
            // SoundToggle.instance.PlayChangeSymbol()

        }, 0.7)
        dataRound.forEach(e => {
            const symbol = this.resolveSymbolByPosition(e.c, e.r);
            if (!symbol) return;
            symbol.FlipSymbol(e);
        });
    }

    stepWinCurrent = 0
    async ClearData() {
        const r = this.sampleJson.rounds[this.indexCurrentReel];
        if (r.win.normal.length > 0) {
            ListReel.instance.ShowMaskEffect()

            // Waymanager.instance.animWay(r.win.ways)
            ListReel.instance.maskEffect.active = true
            this.stepWinCurrent += r.win.stepWin
            this.UpdateStepWIn(this.stepWinCurrent)
            this.removeWinDuplicateFlip(r)
            const flipPos = new Set(
                r.win.wild.map(f => `${f.c}_${f.r}`)
            );
            let disposeCount = 0;
            const disposeTasks: Promise<void>[] = [];

            for (const e of r.win.normal) {
                const key = `${e.c}_${e.r}`;
                if (flipPos.has(key)) {
                    continue;
                }

                const symbol = this.resolveSymbolByPosition(e.c, e.r, e.i);
                if (!symbol) {
                    continue;
                }

                // Tạo delay 0.05s giữa thời điểm bắt đầu Dispose
                await GameManager.waitForSeconds(0.05);

                // KHÔNG await ở đây.
                // Dispose bắt đầu ngay, animation chạy song song với các symbol khác.
                disposeTasks.push(symbol.Dispose());

                disposeCount++;
            }

            // Chờ tất cả symbol destroy xong hoàn toàn rồi mới chạy bước tiếp theo
            await Promise.all(disposeTasks);
            // SoundToggle.instance.PlaySymbolWin()
            this.stepOld = this.sampleJson.rounds[this.indexCurrentReel].multiplier
            MultiplierCarouselFinal.instance.focusTo(this.sampleJson.rounds[this.indexCurrentReel].multiplier)
            TextBoxGame.instant.PlayStepWin(r.baseWin, this.stepOld)
            ListReel.instance.HideMaskEffect()
            await GameManager.waitForSeconds(0.7);
            if (r.win.wild.length > 0) {
                this.FlipData();
            }

            // Chỉ gọi AnimationWin cho các symbol thực sự win
            r.win.normal.forEach(pos => {
                const symbol = this.resolveSymbolByPosition(pos.c, pos.r, pos.i);
                if (symbol) {
                    symbol.AnimationWin();
                }
            });

            // Chờ tất cả reel cascade hoàn tất
            const tasks: Promise<void>[] = [];

            for (let i = 0; i < this.reels.length; i++) {
                if (r.above[i] && r.above[i].length > 0) {
                    tasks.push(this.reels[i].cascadeDrop(r.above[i]));
                }
            }

            await Promise.all(tasks);
            await GameManager.waitForSeconds(1);
        }
        if (r.hasNext) {
            this.indexCurrentReel++;
            await this.ClearData(); // ⭐ cực quan trọng
        }
        else {
            if (this.stepOld > 2) {
            }
            this.ShowBigWin();
        }
    }


    ShowBigWin() {
        const r = this.sampleJson.rounds[this.indexCurrentReel];
        const next = () => {
            if (this.CheckScratch4() == true) {
                this.indexCurrentReel = 0
                this.isFreeSpin = true
                let free = this.getFreeSpin(this.GetNumberScratch())
                FreeSpines.instance.playAnimation(free);
                FreeSpines.instance.UpdateFreeSpinLb(free)

            }
            else {
                if (this.isFreeSpin == true) {
                    this.indexCurrentReel = 0
                    this.PlayModeFreeSpin()
                }
                else {
                    this.indexCurrentReel = 0;
                    this.SetModeNormal();
                    if (Spin.instance.isAuto == true) {
                        Spin.instance.AutoSpinNext()
                    }
                    else {
                        Spin.instance.isSpin = false;
                    }
                }

            }


        };
        // danh sách animation cần chạy
        const winQueue: Array<() => void> = [];
        console.log(r, " check")
        if (r.BigWin) {

            winQueue.push(() => {
                // SoundToggle.instance.playBigWin()
                BigWin.instance.showBigWin(runNext, r.BigWin);
            });
        }

        if (r.SuperWin) {

            winQueue.push(() => {
                // SoundToggle.instance.playBigWin()
                BigWin.instance.showSuperWin(runNext, r.SuperWin);
            });
        }

        if (r.MegaWin) {
            winQueue.push(() => {
                // SoundToggle.instance.playBigWin()
                BigWin.instance.showMegaWin(runNext, r.MegaWin);
            });
        }

        // nếu không có animation nào
        if (winQueue.length === 0) {
            next();
            return;
        }

        let index = 0;

        const runNext = () => {
            if (index >= winQueue.length) {
                next();
                return;
            }

            const fn = winQueue[index];
            index++;
            fn();
        };
        // bắt đầu chạy queue
        runNext();
    }


    CheckScratch() {
        let indexScratch = 0
        this.sampleJson.rounds[this.indexCurrentReel].grid.forEach(reels => {
            reels.forEach(e => {
                if (e.i == SymbolType.SCRATCH) {
                    indexScratch++
                }
            })
        })
        return indexScratch >= 3
    }

    public CheckReelFull3Scratch() {
        let indexScratch = 0
        let grid = this.sampleJson.rounds[this.indexCurrentReel].grid
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j].i == SymbolType.SCRATCH) {
                    indexScratch++
                }
            }
            if (indexScratch >= 2) return i
        }
    }

    public CheckScratch4() {
        let indexScratch = 0
        this.reels.forEach(e => {
            e.symbols.forEach(s => {
                if (s.face == SymbolType.SCRATCH) {
                    indexScratch++;
                }
            })
        })
        if (indexScratch >= 4) return true;
    }


    public GetNumberScratch() {
        let indexScratch = 0
        this.reels.forEach(e => {
            e.symbols.forEach(s => {
                if (s.face == SymbolType.SCRATCH) {
                    indexScratch++;
                }
            })
        })
        return indexScratch
    }

    public playAnimReelScratch(index) {
        this.reels.forEach((e, i) => {
            if (i == index) {
                if (e.spinesEff)
                    e.spinesEff.enabled = true
                // tween(e.maskEff.getComponent(UIOpacity)).to(0.3, { opacity: 0 }).start()
            }
            else {
                if (e.spinesEff)
                    e.spinesEff.enabled = false
                // tween(e.maskEff.getComponent(UIOpacity)).to(0.3, { opacity: 255 }).start()
            }
        })
    }



    ShowAllReef(iSpine = false) {
        this.reels.forEach((e, i) => {
            e.symbols.forEach(s => {
                if (s.face == SymbolType.SCRATCH && iSpine == false) {
                    s.playiconAnimation(s.getNameIdle(), true)
                }
            })
            // tween(e.maskEff.getComponent(UIOpacity)).to(0.3, { opacity: 0 }).start()
        })
    }

    isShowSetting = false

    isShowFooter = false

    priceOffset = 2000
    priceMax = 20000


    static waitForSeconds(s: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, s * 1000));
    }

    GetTimeTurboStarSpin() {
        if (this.turboMode == 0) return 0.75
        if (this.turboMode == 1) return 0.25
        if (this.turboMode == 2) return 0
    }

    GetTimeTurboScratchStart() {
        if (this.turboMode == 0) return 0.2
        if (this.turboMode == 1) return 0
        if (this.turboMode == 2) return 0
    }

    GetTimeTurboStopSpin() {
        if (this.turboMode == 0) return 0.15
        if (this.turboMode == 1) {
            // SoundToggle.instance.PlayScatchIdle()
            return 0
        }
        if (this.turboMode == 2) {
            // SoundToggle.instance.PlayScatchIdle()
            return 0
        }
    }


    GetTimeTurboScratchSpin() {
        if (this.turboMode == 0) {
            // SoundToggle.instance.PlayRollScatch()
            return 2
        }
        if (this.turboMode == 1) {
            return 0
        }
        if (this.turboMode == 2) {
            return 0
        }

    }


    removeWinDuplicateFlip(round: any) {
        if (!round?.win?.positions) return;

        // chỉ loại trùng lặp trong chính win.positions (không loại theo flip)
        const seen = new Set<string>();
        round.win.positions = round.win.positions.filter(p => {
            const key = `${p.c}_${p.r}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    isFreeSpin = false
    indexCurrentFreeSpin = 0
    totalFreeSpin = 0

    getFreeSpin(scratch: number): number {
        if (scratch < 4) return 0;
        this.totalFreeSpin += 10 + (scratch - 4) * 2;
        return this.totalFreeSpin
    }
    GetDataFreeSpin() {
        if (this.indexCurrentFreeSpin >= this.dataFreespin.payload.batchSpins.length) {
            return null
        }
        return this.dataFreespin.payload.batchSpins[this.indexCurrentFreeSpin]
    }

    PlayModeFreeSpin() {
        let dataFree = this.GetDataFreeSpin()
        if (dataFree == null) {
            FreeSpines.instance.ShowTotalSpin(() => {
                this.indexCurrentFreeSpin = 0
                this.isFreeSpin = false
                this.totalFreeSpin = 0
                this.dataFreespin = null
                Spin.instance.ActiveSpin()
                this.SetModeNormal();
                // SoundToggle.instance.playNormal()

                if (Spin.instance.isAuto == true) {
                    Spin.instance.AutoSpinNext()
                }
                else {
                    Spin.instance.isSpin = false;
                }
            }, this.dataFreespin.payload.batchSummary.totalWin);
            return;
        }
        this.SetModeFreeSpin()
        this.indexCurrentFreeSpin++
        this.totalFreeSpin--
        this.isFreeSpin = true
        TextBoxGame.instant.playRandomText()
        this.stepOld = 1
        Spin.instance.isSpin = true
        // Waymanager.instance.resetWay()
        this.sampleJson = dataFree
        const grid = this.sampleJson.rounds[this.indexCurrentReel].grid;
        FreeSpines.instance.UpdateFreeSpinLb(this.totalFreeSpin)
        this.GenerateMap(grid);
    }


    ShowAllScratch(index) {
        this.reels.forEach((r, indexReel) => {
            if (indexReel < index) {
                r.symbols.forEach(e => {
                    if (e.face == SymbolType.SCRATCH) {
                        e.node.setSiblingIndex(99)
                    }
                })
            }

        })
    }
    // change mode

    @property(Sprite)
    bgReels: Sprite = null


    @property(SpriteFrame)
    bgReelsSp1: SpriteFrame[] = []

    @property(Node)
    bgDown: Node = null

    @property(Node)
    bgUp: Node = null
    @property(Node)
    bgFreeSpin: Node = null

    @property(Node)
    walletNode: Node = null

    @property(Node)
    btnNode: Node = null

    @property(Node)
    uiFreewin: Node = null

    @property(Node)
    wayFree: Node = null

    SetModeNormal() {
        this.bgReels.spriteFrame = this.bgReelsSp1[0]
        this.bgDown.active = true
        this.bgReels.node.setPosition(0, 117, 0)
        this.bgFreeSpin.active = false
        this.walletNode.setPosition(21.22, -354)
        this.btnNode.active = true
        this.bgUp.active = true
        this.wayFree.active = false
        this.uiFreewin.active = false
    }


    SetModeFreeSpin() {
        this.bgReels.spriteFrame = this.bgReelsSp1[1]
        this.bgDown.active = false
        this.bgReels.node.setPosition(0, 41, 0)
        this.bgFreeSpin.active = true
        this.walletNode.setPosition(21.22, -596.327)
        this.btnNode.active = false
        this.bgUp.active = false
        this.wayFree.active = true
        this.uiFreewin.active = true
    }
}

