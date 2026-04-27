import { _decorator, Button, Component, Input, Label, Node, sp } from 'cc';
import { GameManager } from '../Manager/GameManager';

const { ccclass, property } = _decorator;

@ccclass('Spin')
export class Spin extends Component {
    @property(sp.Skeleton)
    skeletonSpin: sp.Skeleton = null

    public static instance: Spin

    protected onLoad(): void {
        Spin.instance = this
    }

    protected start(): void {
        this.node.on(Node.EventType.MOUSE_ENTER, this.MouseEnter, this)
        this.node.on(Node.EventType.MOUSE_LEAVE, this.MoveLeave, this)
        this.node.on(Input.EventType.TOUCH_END, this.TouchEnd, this)
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

    StartSpin() {
        this.isSpin = true
        // SoundToggle.instance.PlaySpin()
        this.isIdle = true
        this.skeletonSpin.setAnimation(0, "action_start", false)
        this.skeletonSpin.addAnimation(0, "action_loop", false)
        this.skeletonSpin.addAnimation(0, "idle", true)

        this.skeletonSpin.setCompleteListener((tracking) => {
            if (tracking.animation.name == "idle") {
                this.isIdle = false
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
        this.skeletonSpin.setAnimation(0, "auto_idle")
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
        this.skeletonSpin.node.active = true
        this.skeletonSpin.setAnimation(0, "idle", true)
    }

    // ================= FX =================

    isMove = false

    MouseEnter() {
        if (this.isMove) return
        this.isMove = true

        if (this.isAuto == true) {
            this.skeletonSpin.setAnimation(0, "auto_touch", true)
        }
        else {
            if (this.isIdle == false) {
                this.skeletonSpin.setAnimation(0, "idle_touch", true)

            }
        }
    }



    MoveLeave() {
        this.isMove = false
        if (this.isAuto == true) {
            this.skeletonSpin.setAnimation(0, "auto_idle", true)
        }
        else {
            if (this.isIdle == false) {
                this.skeletonSpin.setAnimation(0, "idle", true)

            }
        }
    }

}