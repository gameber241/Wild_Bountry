import { _decorator, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3, director, resources, JsonAsset, Camera } from 'cc';
import { ReelBase } from '../Reels/ReelBase';
import { SymbolType } from '../Enum/ESymbolFace';
import { Symbol } from '../Reels/Symbol';
import { dataSpin, sampleJson } from '../DataExample';
import { ListReel } from '../Reels/ListReel';
import { Spin } from '../Game/Spin';
import { MultiplierCarouselFinal } from '../Game/MultiplierAnimator';
import { TextBoxGame } from '../Game/TextBoxGame';
import { BigWin } from '../Game/BigWin';
import { FreeSpines } from '../Game/FreeSpines';

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


    isTurbo = false

    turboMode = 0


    //data Freespin
    dataFreespin = dataSpin
    otherHeight = 0
    AnimFirstGame() {
        this.otherHeight = this.cameraMain.orthoHeight
        this.cameraMain.orthoHeight = this.otherHeight + 150
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
        this.UpdatePriceWin
        this.SetModeNormal()
        this.initGrid()
        this.updateBalanceDisplay();
        this.reels = ListReel.instance.reels
        // this.scheduleOnce(() => {
        //     const wsService = WebSocketService.getInstance();
        //     if (wsService) {
        //         wsService.getProfile();
        //     }
        // }, 0.1);
    }

    onProfileUpdated(payload: any): void {
        // const balance = this.extractBalanceFromPayload(payload);
        // if (balance !== null) {
        //     UserInfo.getInstance().updateBalance(balance);
        //     this.updateBalanceDisplay();
        // } else {
        //     console.warn('[GameManager] Could not extract balance from payload');
        // }
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

    updateBalanceDisplay(): void {
        // const balance = UserInfo.getInstance().balance;
        // console.log('[GameManager] updateBalanceDisplay - balance from UserInfo:', balance);

        // if (this.walet) {
        //     const formatted = balance.toLocaleString('en-US', {
        //         minimumFractionDigits: 2,
        //         maximumFractionDigits: 2
        //     });
        //     console.log('[GameManager] Setting walet.string to:', formatted);
        //     this.walet.string = formatted;
        //     this.ballanTitle.string = formatted;
        //     this.walletAuto.string = formatted;



        // } else {
        //     console.warn('[GameManager] walet Label is null!');
        // }
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
        // TextBoxCombo.instant.box.setAnimation(0, "textBox1_idle", true)

        // // If this is the first round, fetch spin result from server
        // if (this.indexCurrentReel === 0) {
        //     const useServerSpin = GameConfig.useServerSpin; // Read from config
        //     if (useServerSpin === false) {
        //         // Convert callback to Promise and await it
        //         await new Promise<void>((resolve, reject) => {
        //             resources.load('test-spin-data', JsonAsset, (err, jsonAsset) => {
        //                 if (err) {
        //                     console.error("[GameManager] Failed to load test data:", err);
        //                     Spin.instance.ActiveSpin();
        //                     reject(err);
        //                     return;
        //                 }
        //                 const spinResult = jsonAsset.json;
        //                 console.log("[GameManager] Using TEST data:", spinResult);

        //                 if (spinResult.success) {
        //                     this.sampleJson = spinResult;
        //                     console.log("[GameManager] Updated sampleJson with TEST data");

        //                     // Update balance
        //                     UserInfo.getInstance().updateBalance(UserInfo.getInstance().balance - this.betCurrent + spinResult.totalWin);
        //                     this.updateBalanceDisplay();
        //                     resolve();
        //                 } else {
        //                     console.error("[GameManager] Test data invalid");
        //                     if (this.isFreeSpin == true) return

        //                     Spin.instance.ActiveSpin();
        //                     reject(new Error("Invalid test data"));
        //                 }
        //             });
        //         });
        //     } else {
        //         try {
        //             // Get WebSocketService instance, try to find it if null
        //             let wsService = WebSocketService.getInstance();
        //             if (!wsService) {
        //                 console.warn("[GameManager] WebSocketService instance is null, trying to find persisted node");
        //                 const wsNode = director.getScene().getChildByName('WebSocketService');
        //                 if (wsNode) {
        //                     wsService = wsNode.getComponent(WebSocketService);
        //                     console.log("[GameManager] Found WebSocketService from persisted node");
        //                 }
        //             }

        //             if (!wsService) {
        //                 console.error("[GameManager] WebSocketService not available");
        //                 if (this.isFreeSpin == true) return

        //                 Spin.instance.ActiveSpin();
        //                 return;
        //             }

        //             const spinResult = await wsService.spin(this.betCurrent);
        //             console.log("[GameManager] Spin result received:", spinResult);

        //             if (spinResult.success) {
        //                 this.sampleJson = spinResult;
        //                 console.log("[GameManager] Updated sampleJson with server data");

        //                 // Update balance
        //                 UserInfo.getInstance().updateBalance(UserInfo.getInstance().balance - this.betCurrent + spinResult.totalWin);
        //                 this.updateBalanceDisplay();
        //             } else {
        //                 console.error("[GameManager] Spin failed:", spinResult.error);
        //                 if (this.isFreeSpin == true) return
        //                 Spin.instance.ActiveSpin();
        //                 return;
        //             }
        //         } catch (error) {
        //             console.error("[GameManager] Spin API error:", error);
        //             if (this.isFreeSpin == true) return
        //             Spin.instance.ActiveSpin();
        //             return;
        //         }
        //     }
        // }

        this.SpinGame()
    }

    stepOld = 1
    SpinGame() {
        MultiplierCarouselFinal.instance.resetCombo()
        this.sampleJson = sampleJson
        this.stepWinCurrent = 0
        this.UpdatePriceWin()
        // TextBoxCombo.instant.playRandomText()
        this.stepOld = 1
        Spin.instance.isSpin = true
        // Waymanager.instance.resetWay()
        const round = this.sampleJson.rounds[this.indexCurrentReel];

        this.SetModeNormal();
        const grid = round.grid;
        this.GenerateMap(grid);
    }

    UpdatePriceWin() {
        // this.winLb.string = currencyFormatSimple.format(this.stepWinCurrent)
        // this.winLbAuto.string = currencyFormatSimple.format(this.stepWinCurrent)

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
        tween(this.cameraMain).to(1, { orthoHeight: this.otherHeight + 150 })
            .call(async () => {

            })
            .start()

        TextBoxGame.instant.playScratch()
        let current = index + 1;

        while (current < this.reels.length) {
            const reel = this.reels[current];
            reel.changeSpeed(0.1)
            ListReel.instance.ShowMaskEffect()
            this.ShowAllScratch(current)
            reel.ShowAllSymbol()
            ListReel.instance.ShowVfxLight(current)
            await GameManager.waitForSeconds(this.GetTimeTurboScratchSpin());
            reel.stopRoll(grid[current]);
            reel._delay = 0.06
            ListReel.instance.HideVfxLight()
            await GameManager.waitForSeconds(0.3);
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
        let dataRound = this.sampleJson.rounds[this.indexCurrentReel].flips;
        this.scheduleOnce(() => {
            // SoundToggle.instance.PlayChangeSymbol()

        }, 0.7)
        dataRound.forEach(e => {
            const symbol = this.resolveSymbolByPosition(e.from.c, e.from.r);
            if (!symbol) return;
            symbol.FlipSymbol(e.to);
        });
    }

    stepWinCurrent = 0
    async ClearData() {
        const r = this.sampleJson.rounds[this.indexCurrentReel];
        if (r.win.positions.length > 0) {
            ListReel.instance.ShowMaskEffect()

            // Waymanager.instance.animWay(r.win.ways)
            ListReel.instance.maskEffect.active = true
            this.stepWinCurrent += r.win.stepWin
            this.UpdatePriceWin()
            this.removeWinDuplicateFlip(r)
            const flipPos = new Set(
                r.flips.map(f => `${f.from.c}_${f.from.r}`)
            );
            let disposeCount = 0;
            for (const e of r.win.positions) {
                const key = `${e.c}_${e.r}`;
                if (flipPos.has(key)) {

                    continue;
                }
                const symbol = this.resolveSymbolByPosition(e.c, e.r, e.i);
                if (!symbol) {
                    continue;
                }
                await GameManager.waitForSeconds(0.05);
                symbol.Dispose();
                disposeCount++;
            }

            // SoundToggle.instance.PlaySymbolWin()
            this.stepOld = this.sampleJson.rounds[this.indexCurrentReel].multiplier
            MultiplierCarouselFinal.instance.focusTo(this.sampleJson.rounds[this.indexCurrentReel].multiplier)
            TextBoxGame.instant.PlayStepWin(r.win.stepWin, this.stepOld)

            await GameManager.waitForSeconds(1.1);
            ListReel.instance.HideMaskEffect()

            if (r.flips.length > 0) {
                this.FlipData();
                await GameManager.waitForSeconds(2);
            }
            // Chỉ gọi AnimationWin cho các symbol thực sự win
            r.win.positions.forEach(pos => {
                const symbol = this.resolveSymbolByPosition(pos.c, pos.r, pos.i);
                if (symbol) {
                    symbol.AnimationWin();
                }
            });
            this.reels.forEach((reel, i) => {
                if (r.above[i] && r.above[i].length > 0) {
                    reel.cascadeDrop(r.above[i]);
                }
            });

            await GameManager.waitForSeconds(2);
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
                FreeSpines.instance.playAnimation(this.getFreeSpin(this.GetNumberScratch()));
            }
            else {
                if (this.isFreeSpin == true) {
                    this.indexCurrentReel = 0
                    this.PlayModeFreeSpin()
                }
                else {
                    this.indexCurrentReel = 0;
                    Spin.instance.ActiveSpin()
                    this.SetModeNormal();
                    // SoundToggle.instance.playNormal()
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

    @property(Node)
    ballanNode: Node = null

    @property(Label)
    ballanTitle: Label = null


    BtnBallan() {
        this.ballanNode.active = true
    }
    btnCloseBallan() {
        this.ballanNode.active = false

    }

    @property(Node)
    DatCuocNode: Node = null

    BtnCuoc() {
        this.DatCuocNode.active = true
    }



    betCurrent = 0.6

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
        this.UpdatePriceWin()
        TextBoxGame.instant.playRandomText()
        this.stepOld = 1
        Spin.instance.isSpin = true
        // Waymanager.instance.resetWay()
        this.sampleJson = dataFree
        const grid = this.sampleJson.rounds[this.indexCurrentReel].grid;
        // FreeSpines.instance.UpdateFreeSpinLb(this.totalFreeSpin)
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


    SetModeNormal() {
        this.bgReels.spriteFrame = this.bgReelsSp1[0]
        this.bgDown.active = true
        this.bgReels.node.setPosition(0, 117, 0)

    }


    SetModeFreeSpin() {
        this.bgReels.spriteFrame = this.bgReelsSp1[1]
        this.bgDown.active = false
        this.bgReels.node.setPosition(0, 41, 0)


    }
}

