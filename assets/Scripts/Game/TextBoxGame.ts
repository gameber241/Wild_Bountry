import { _decorator, Component, Label, Node, randomRangeInt, sp, Sprite, SpriteFrame, Tween, tween, UIOpacity, Vec3 } from 'cc';
import { currencyFormatSimple } from '../Manager/GameManager';
import { MultiplierCarouselFinal } from './MultiplierAnimator';
const { ccclass, property } = _decorator;

@ccclass('TextBoxCombo')
export class TextBoxGame extends Component {
    @property(Sprite)
    textRandom: Sprite = null

    @property(SpriteFrame)
    texts: SpriteFrame[] = []

    @property(Node)
    totalWin: Node = null

    @property(Node)
    stepWin: Node = null


    @property(Node)
    textTotalWin: Node = null

    @property(Label)
    lbScore: Label = null

    @property(Label)
    comboAnim: Label = null

    @property(sp.Skeleton)
    box: sp.Skeleton = null

    @property(SpriteFrame)
    textScratch: SpriteFrame = null


    public static instant: TextBoxGame

    protected start(): void {
        TextBoxGame.instant = this
        this.playRandomText()
    }
    playScratch() {
        this.totalWin.active = false
        this.textRandom.node.active = true
        this.textRandom.spriteFrame = this.textScratch;
    }
    playRandomText() {
        this.totalWin.active = false
        this.textRandom.node.active = true
        let random = randomRangeInt(0, this.texts.length)
        this.textRandom.spriteFrame = this.texts[random]
        if (random == 0) {
            this.textRandom.node.setPosition(160.37, 0, 0)
            tween(this.textRandom.node).to(6, { position: new Vec3(-156, 0, 0) })
                .call(() => {
                    this.playRandomText()
                })
                .start()

        } else
            if (random == 1) {
                this.textRandom.node.setPosition(95, 0, 0)
                tween(this.textRandom.node).to(6, { position: new Vec3(-74, 0, 0) })
                    .call(() => {
                        this.playRandomText()
                    })
                    .start()

            }
            else
                if (random == 2 || random == 3 || random == 4) {
                    this.textRandom.node.setPosition(116, 0, 0)
                    tween(this.textRandom.node).to(6, { position: new Vec3(-130, 0, 0) })
                        .call(() => {
                            this.playRandomText()
                        })
                        .start()

                }
                else {
                    this.textRandom.node.setPosition(0, 30, 0)
                    this.scheduleOnce(() => {
                        this.playRandomText()
                    }, 3)
                }

    }

    PlayStepWin(step, multi) {
        Tween.stopAllByTarget(this.textRandom.node)
        this.unscheduleAllCallbacks()
        this.totalWin.active = true
        this.textRandom.node.active = false
        this.stepWin.active = false
        this.textTotalWin.active = false
        this.comboAnim.node.parent.active = false
        if (multi == 1) {
            this.stepWin.active = true
            this.lbScore.string = currencyFormatSimple.format(step)

        }
        else {
            let result = step * multi
            result = Number(result.toFixed(2))
            this.scheduleOnce(() => {
                this.comboAnim.node.parent.active = true
                this.comboAnim.node.parent.setScale(1, 1, 1)
                this.comboAnim.string = "X" + multi
                this.comboAnim.node.parent.setWorldPosition(MultiplierCarouselFinal.instance.getCenterNode().worldPosition.clone())
                tween(this.comboAnim.node.parent)
                    .to(0.25, { position: new Vec3(0, 455, 0) })
                    .delay(0.2)
                    .to(0.25, { position: new Vec3(0, 0, 0) })
                    .call(() => {
                        this.comboAnim.node.parent.active = false
                        if (multi < 8)
                            this.box.setAnimation(0, "lv1", false)
                        else {
                            this.box.setAnimation(0, "lv2", false)

                        }

                    })
                    .start()
                tween(this.comboAnim.node.parent)
                    .to(0.25, { scale: new Vec3(2, 2, 2) })
                    .delay(0.2)
                    .to(0.25, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        this.comboAnim.node.parent.active = false
                    })
                    .start()
                this.stepWin.active = true
                this.lbScore.string = currencyFormatSimple.format(step)
            }, 1)

        }
    }

    PlayTotalWIn(total) {
        Tween.stopAllByTarget(this.textRandom.node)
        this.totalWin.active = true
        this.unscheduleAllCallbacks()

        this.textRandom.node.active = false
        this.stepWin.active = false
        this.textTotalWin.active = false

        this.textTotalWin.active = true
        this.lbScore.string = currencyFormatSimple.format(total)

    }

}

