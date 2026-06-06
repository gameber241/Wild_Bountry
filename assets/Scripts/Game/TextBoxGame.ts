import {
    _decorator,
    Component,
    Label,
    Node,
    randomRangeInt,
    sp,
    Sprite,
    SpriteFrame,
    Tween,
    tween,
    Vec3,
} from 'cc';
import { currencyFormatSimple } from '../Manager/GameManager';
import { MultiplierCarouselFinal } from './MultiplierAnimator';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('TextBoxGame')
export class TextBoxGame extends Component {
    @property(Sprite)
    textRandom: Sprite = null!;

    @property(SpriteFrame)
    texts: SpriteFrame[] = [];

    @property(Node)
    totalWin: Node = null!;

    @property(Node)
    stepWin: Node = null!;

    @property(Node)
    textTotalWin: Node = null!;

    @property(Label)
    lbScore: Label = null!;

    @property(Label)
    comboAnim: Label = null!;

    @property(sp.Skeleton)
    box: sp.Skeleton = null!;

    @property(SpriteFrame)
    textScratch: SpriteFrame = null!;

    public static instant: TextBoxGame;

    // ===== Runtime =====
    private randomTextTween: Tween<Node> | null = null;
    private isRandomTextPlaying = false;
    private randomTextScheduleCallback: (() => void) | null = null;

    protected start(): void {
        TextBoxGame.instant = this;
        this.playRandomText(true);
    }

    protected onDisable(): void {
        this.stopRandomText();
    }

    protected onDestroy(): void {
        this.stopRandomText();

        if (TextBoxGame.instant === this) {
            TextBoxGame.instant = null!;
        }
    }

    // =====================================================
    // Random Text Control
    // =====================================================

    private stopRandomText(): void {
        if (this.randomTextTween) {
            this.randomTextTween.stop();
            this.randomTextTween = null;
        }

        Tween.stopAllByTarget(this.textRandom.node);

        if (this.randomTextScheduleCallback) {
            this.unschedule(this.randomTextScheduleCallback);
            this.randomTextScheduleCallback = null;
        }

        this.isRandomTextPlaying = false;
    }

    /**
     * Chạy text random liên tục.
     *
     * forceRestart = false:
     * - Nếu random text đang chạy thì không cắt tween hiện tại.
     *
     * forceRestart = true:
     * - Dừng animation cũ và chạy lại từ đầu.
     */
    playRandomText(forceRestart: boolean = false): void {
        if (!this.textRandom || this.texts.length <= 0) {
            return;
        }

        // Nếu đang chạy rồi thì để tween hiện tại chạy hết
        if (this.isRandomTextPlaying && !forceRestart) {
            return;
        }

        if (forceRestart) {
            this.stopRandomText();
        }

        this.isRandomTextPlaying = true;

        this.totalWin.active = false;
        this.textRandom.node.active = true;
        this.stepWin.active = false;
        this.textTotalWin.active = false;

        const random = randomRangeInt(0, this.texts.length);
        this.textRandom.spriteFrame = this.texts[random];

        const config = this.getRandomTextMoveConfig(random);

        if (!config.useTween) {
            this.playStaticRandomText();
            return;
        }

        this.textRandom.node.setPosition(config.startPos);

        this.randomTextTween = tween(this.textRandom.node)
            .to(config.duration, { position: config.endPos })
            .call(() => {
                this.randomTextTween = null;
                this.isRandomTextPlaying = false;
                this.playRandomText();
            });

        this.randomTextTween.start();
    }

    private getRandomTextMoveConfig(index: number): {
        useTween: boolean;
        startPos: Vec3;
        endPos: Vec3;
        duration: number;
    } {
        const duration = 6;

        if (index === 0) {
            return {
                useTween: true,
                startPos: new Vec3(160.37, 0, 0),
                endPos: new Vec3(-156, 0, 0),
                duration,
            };
        }

        if (index === 1) {
            return {
                useTween: true,
                startPos: new Vec3(95, 0, 0),
                endPos: new Vec3(-74, 0, 0),
                duration,
            };
        }

        if (index === 2 || index === 3 || index === 4) {
            return {
                useTween: true,
                startPos: new Vec3(116, 0, 0),
                endPos: new Vec3(-130, 0, 0),
                duration,
            };
        }

        return {
            useTween: false,
            startPos: Vec3.ZERO,
            endPos: Vec3.ZERO,
            duration: 0,
        };
    }

    private playStaticRandomText(): void {
        this.textRandom.node.setPosition(0, 30, 0);

        this.randomTextScheduleCallback = () => {
            this.randomTextScheduleCallback = null;
            this.isRandomTextPlaying = false;
            this.playRandomText();
        };

        this.scheduleOnce(this.randomTextScheduleCallback, 3);
    }

    // =====================================================
    // Scratch Text
    // =====================================================

    playScratch(): void {
        this.stopRandomText();

        this.totalWin.active = false;
        this.stepWin.active = false;
        this.textTotalWin.active = false;

        this.textRandom.node.active = true;
        this.textRandom.spriteFrame = this.textScratch;
        this.textRandom.node.setPosition(0, 0, 0);
    }

    // =====================================================
    // Step Win
    // =====================================================

    PlayStepWin(step: number, multi: number): void {
        this.stopRandomText();

        this.totalWin.active = true;
        this.textRandom.node.active = false;
        this.stepWin.active = false;
        this.textTotalWin.active = false;

        const comboParent = this.comboAnim.node.parent;
        if (comboParent) {
            comboParent.active = false;
        }

        if (multi === 1) {
            AudioManager.instance.WinBatHit();

            this.stepWin.active = true;
            this.lbScore.string = currencyFormatSimple.format(step);
            return;
        }

        this.playMultiplierStepWin(step, multi);
    }

    private playMultiplierStepWin(step: number, multi: number): void {
        this.scheduleOnce(() => {
            const comboParent = this.comboAnim.node.parent;
            if (!comboParent) {
                this.showStepScore(step);
                return;
            }

            const centerNode = MultiplierCarouselFinal.instance.getCenterNode();

            comboParent.active = true;
            comboParent.setScale(1, 1, 1);
            comboParent.setPosition(0, 0, 0);
            comboParent.setWorldPosition(centerNode.worldPosition.clone());

            this.comboAnim.string = 'X' + multi;

            tween(comboParent)
                .to(0.25, { position: new Vec3(0, 455, 0) })
                .delay(0.2)
                .to(0.25, { position: new Vec3(0, 0, 0) })
                .call(() => {
                    comboParent.active = false;
                    this.playBoxWinAnimation(multi);
                })
                .start();

            tween(comboParent)
                .to(0.25, { scale: new Vec3(2, 2, 2) })
                .delay(0.2)
                .to(0.25, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    comboParent.active = false;
                })
                .start();

            this.showStepScore(step);
        }, 1);
    }

    private showStepScore(step: number): void {
        this.stepWin.active = true;
        this.lbScore.string = currencyFormatSimple.format(step);
    }

    private playBoxWinAnimation(multi: number): void {
        if (multi < 8) {
            AudioManager.instance.WinBat1();
            this.box.setAnimation(0, 'lv1', false);
        } else {
            AudioManager.instance.WinBat2();
            this.box.setAnimation(0, 'lv2', false);
        }
    }

    // =====================================================
    // Total Win
    // =====================================================

    PlayTotalWIn(total: number): void {
        this.stopRandomText();

        this.totalWin.active = true;
        this.textRandom.node.active = false;
        this.stepWin.active = false;

        this.textTotalWin.active = true;
        this.lbScore.string = currencyFormatSimple.format(total);
    }
}