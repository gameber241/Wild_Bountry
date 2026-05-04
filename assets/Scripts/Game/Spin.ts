import { _decorator, Button, Component, Input, Label, Node, sp } from 'cc';
import { GameManager } from '../Manager/GameManager';

const { ccclass, property } = _decorator;

@ccclass('Spin')
export class Spin extends Component {
    @property(sp.Skeleton)
    animSpinPlay: sp.Skeleton = null

    @property(sp.Skeleton)
    animBg: sp.Skeleton = null

    @property(sp.Skeleton)
    animRotate: sp.Skeleton = null
    public static instance: Spin

    protected onLoad(): void {
        Spin.instance = this
    }

    protected start(): void {
        this.node.on(Node.EventType.MOUSE_ENTER, this.MouseEnter, this)
        this.node.on(Node.EventType.MOUSE_LEAVE, this.MoveLeave, this)
        this.node.on(Input.EventType.TOUCH_END, this.TouchEnd, this)

        this.PlayIdle()
    }

    // ================= NORMAL SPIN =================

    isSpin = false
    isIdle = false

    TouchEnd() {
        if (this.isSpin) return

        // nếu đang auto mà bấm tay => tắt auto
        if (this.isAuto) this.StopAuto()

        this.StartSpin()
    }

    PlayIdle() {
        this.animRotate.node.active = true
        this.animSpinPlay.node.active = false
        this.animBg.node.active = true

        this.animBg.setAnimation(0, "idle", true)
        // this.animRotate.setAnimation(0, "idle_rotate", true)

    }

    PlayIdleHover() {
        this.animRotate.node.active = true
        this.animSpinPlay.node.active = false
        this.animBg.node.active = true

        this.animBg.setAnimation(0, "idle_touch", true)
        // this.animRotate.setAnimation(0, "idle_rotate", true)

    }


    PlayIdleAuto() {
        this.animRotate.node.active = true
        this.animSpinPlay.node.active = false
        this.animBg.node.active = true

        this.animBg.setAnimation(0, "auto_idle", true)
        // this.animRotate.setAnimation(0, "idle_rotate", true)

    }

    PlayIdleHoverAuto() {
        this.animRotate.node.active = true
        this.animSpinPlay.node.active = false
        this.animBg.node.active = true

        this.animBg.setAnimation(0, "auto_touch", true)
        // this.animRotate.setAnimation(0, "idle_rotate", true)

    }

    StartSpin() {
        this.isSpin = true
        // SoundToggle.instance.PlaySpin()
        this.isIdle = true
        this.animRotate.node.active = false
        this.animSpinPlay.node.active = true
        this.animBg.node.active = true
        this.animSpinPlay.setAnimation(0, "action_start", false)
        // this.animSpinPlay.addAnimation(0, "action_loop", false)
        // this.animSpinPlay.addAnimation(0, "idle", true)

        this.animSpinPlay.setCompleteListener((tracking) => {
            if (tracking.animation.name == "action_start") {
                this.isIdle = false
                if (this.isAuto) {
                    this.PlayIdleAuto()
                }
                else {
                    this.PlayIdle()
                }
            }
        })
        GameManager.instance.PlaySpin()
    }

    ActiveSpin() {
        this.isSpin = false
        // ⭐ auto spin tiếp tại đây
        if (this.isAuto) {
            this.AutoSpinNext()
        }
    }

    // ================= AUTO SPIN =================

    isAuto = false
    autoCount = 0

    PlayAuto(number: number) {
        if (this.isAuto) {
            this.StopAuto()
            return
        }
        this.isAuto = true
        this.autoCount = number
        // this.skeletonSpin.node.active = false
        this.animSpinPlay.setAnimation(0, "auto_idle")
        this.StartSpin()
    }

    AutoSpinNext() {

        if (this.autoCount <= 0) {
            this.StopAuto()
            return
        }
        this.autoCount--
        this.StartSpin()
    }

    StopAuto() {
        this.isAuto = false
        this.animSpinPlay.node.active = true
        this.animSpinPlay.setAnimation(0, "idle", true)
    }

    // ================= FX =================

    isMove = false

    MouseEnter() {
        if (this.isMove) return
        this.isMove = true

        if (this.isAuto == true) {
            this.PlayIdleHoverAuto()
        }
        else {
            if (this.isIdle == false) {
                this.PlayIdleHover()
            }
        }
    }



    MoveLeave() {
        this.isMove = false
        if (this.isAuto == true) {
            this.PlayIdleAuto()
        }
        else {
            if (this.isIdle == false) {
                this.PlayIdle()
            }
        }
    }

}