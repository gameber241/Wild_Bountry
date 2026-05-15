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

    protected start(): void {
        TextBoxGame.instant = this;
        this.playRandomText();
    }

    // =====================================================
    // Random Text
    // =====================================================

    /**
     * Dừng hoàn toàn animation text random đang chạy
     */
    private stopRandomText(): void {
        // Stop tween đang được giữ reference
        if (this.randomTextTween) {
            this.randomTextTween.stop();
            this.randomTextTween = null;
        }

        // Stop tất cả tween gắn với node này (phòng trường hợp còn tween khác)
        Tween.stopAllByTarget(this.textRandom.node);

        // Hủy tất cả scheduleOnce đang chờ
        this.unscheduleAllCallbacks();
    }

    /**
     * Hiển thị text Scratch
     */
    playScratch(): void {
        this.stopRandomText();

        this.totalWin.active = false;
        this.textRandom.node.active = true;
        this.textRandom.spriteFrame = this.textScratch;
    }

    /**
     * Chạy text random liên tục.
     * Nếu bị gọi khi animation cũ đang chạy thì sẽ tự stop và restart từ đầu.
     */
    playRandomText(): void {
        // Quan trọng: luôn stop animation cũ trước khi chạy mới
        this.stopRandomText();

        this.totalWin.active = false;
        this.textRandom.node.active = true;

        const random = randomRangeInt(0, this.texts.length);
        this.textRandom.spriteFrame = this.texts[random];

        let startPos: Vec3;
        let endPos: Vec3;
        let duration = 6;
        let useTween = true;

        if (random === 0) {
            startPos = new Vec3(160.37, 0, 0);
            endPos = new Vec3(-156, 0, 0);
        }
        else if (random === 1) {
            startPos = new Vec3(95, 0, 0);
            endPos = new Vec3(-74, 0, 0);
        }
        else if (random === 2 || random === 3 || random === 4) {
            startPos = new Vec3(116, 0, 0);
            endPos = new Vec3(-130, 0, 0);
        }
        else {
            // Text đứng yên trong 3 giây
            useTween = false;
            this.textRandom.node.setPosition(0, 30, 0);

            this.scheduleOnce(() => {
                this.playRandomText();
            }, 3);
        }

        if (useTween) {
            this.textRandom.node.setPosition(startPos);

            this.randomTextTween = tween(this.textRandom.node)
                .to(duration, { position: endPos })
                .call(() => {
                    this.randomTextTween = null;
                    this.playRandomText();
                });

            this.randomTextTween.start();
        }
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
        this.comboAnim.node.parent!.active = false;

        if (multi === 1) {
            this.stepWin.active = true;
            this.lbScore.string = currencyFormatSimple.format(step);
        }
        else {
            let result = step * multi;
            result = Number(result.toFixed(2));

            this.scheduleOnce(() => {
                const comboParent = this.comboAnim.node.parent!;

                comboParent.active = true;
                comboParent.setScale(1, 1, 1);
                comboParent.setPosition(0, 0, 0);

                this.comboAnim.string = 'X' + multi;

                // Đặt đúng world position
                comboParent.setWorldPosition(
                    MultiplierCarouselFinal.instance
                        .getCenterNode()
                        .worldPosition.clone()
                );

                // Tween di chuyển
                tween(comboParent)
                    .to(0.25, { position: new Vec3(0, 455, 0) })
                    .delay(0.2)
                    .to(0.25, { position: new Vec3(0, 0, 0) })
                    .call(() => {
                        comboParent.active = false;

                        if (multi < 8) {
                            this.box.setAnimation(0, 'lv1', false);
                        }
                        else {
                            this.box.setAnimation(0, 'lv2', false);
                        }
                    })
                    .start();

                // Tween scale
                tween(comboParent)
                    .to(0.25, { scale: new Vec3(2, 2, 2) })
                    .delay(0.2)
                    .to(0.25, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        comboParent.active = false;
                    })
                    .start();

                // Hiển thị step score
                this.stepWin.active = true;
                this.lbScore.string = currencyFormatSimple.format(step);
            }, 1);
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
        this.textTotalWin.active = false;

        this.textTotalWin.active = true;
        this.lbScore.string = currencyFormatSimple.format(total);
    }
}