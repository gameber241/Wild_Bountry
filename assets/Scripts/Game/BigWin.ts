import { _decorator, Component, Input, Label, sp, Tween, tween } from 'cc';
import { currencyFormatSimple } from '../Manager/GameManager';

const { ccclass, property } = _decorator;

@ccclass('BigWin')
export class BigWin extends Component {

    public static instance: BigWin = null!;

    protected onLoad(): void {
        BigWin.instance = this;
    }

    @property(sp.Skeleton)
    fxBigwin: sp.Skeleton = null!;

    @property(Label)
    textBigwin: Label = null!;

    @property(Label)
    textMegawin: Label = null!;

    @property(Label)
    textSuperwin: Label = null!;

    // =============================

    private currentValue: number = 0;
    private targetValue: number = 0;

    private tweenObj: { value: number } | null = null;
    private runningTween: Tween<any> | null = null;

    private touchHandler: Function | null = null;

    private isStopped: boolean = false;

    // =============================

    showBigWin(callback?: Function, current: number = 0) {
        this.prepareShow(current, this.textBigwin, "BigWin_start", "BigWin_loop", callback);
    }

    showMegaWin(callback?: Function, current: number = 0) {
        this.prepareShow(current, this.textMegawin, "MegaWin_start", "MegaWin_loop", callback);
    }

    showSuperWin(callback?: Function, current: number = 0) {
        this.prepareShow(current, this.textSuperwin, "SuperWin_start", "SuperWin_loop", callback);
    }

    // =============================

    private prepareShow(
        value: number,
        activeLabel: Label,
        appearAnim: string,
        idleAnim: string,
        callback?: Function
    ) {
        // reset state
        this.resetState();

        // bật FX root
        this.node.children[0].active = true;

        // bật đúng label
        this.textBigwin.node.active = false;
        this.textMegawin.node.active = false;
        this.textSuperwin.node.active = false;
        activeLabel.node.active = true;
        this.endAnim = appearAnim.replace("_start", "_end");
        // spine animation
        this.fxBigwin.setAnimation(0, appearAnim, false);
        this.fxBigwin.addAnimation(0, idleAnim, true);

        // play number
        this.playTo(value, 3, activeLabel, callback);
    }

    // =============================

    private playTo(targetValue: number, duration: number, label: Label, callback?: Function) {

        this.targetValue = targetValue;
        this.tweenObj = { value: this.currentValue };

        this.runningTween = tween(this.tweenObj)
            .to(duration, { value: targetValue }, {
                easing: "cubicOut",
                onUpdate: () => {
                    if (!this.tweenObj) return;
                    this.currentValue = this.tweenObj.value;
                    label.string = currencyFormatSimple.format(this.currentValue);
                }
            })
            .call(() => {
                this.complete(label, callback);
            })
            .start();

        // register touch skip
        this.touchHandler = () => {
            this.stopAndComplete(label, callback);
        };

        this.node.on(Input.EventType.TOUCH_END, this.touchHandler, this);
    }

    // =============================

    private stopAndComplete(label: Label, callback?: Function) {

        if (this.isStopped) return;
        this.isStopped = true;

        if (this.runningTween) {
            this.runningTween.stop();
            this.runningTween = null;
        }

        if (this.tweenObj) {
            this.currentValue = this.targetValue;
            label.string = currencyFormatSimple.format(this.targetValue)
        }

        this.complete(label, callback);
    }

    // =============================
    private endAnim: string = "";
    private complete(label: Label, callback?: Function) {

        // remove event
        if (this.touchHandler) {
            this.node.off(Input.EventType.TOUCH_END, this.touchHandler, this);
            this.touchHandler = null;
        }

        // delay giống slot
        this.scheduleOnce(() => {

            // 🔥 play end animation
            const entry = this.fxBigwin.setAnimation(0, this.endAnim, false);

            label.node.active = false
            // ⏱ lấy duration animation
            const duration = entry?.animation?.duration ?? 1;

            // 🔥 đợi anim end xong mới hide
            this.scheduleOnce(() => {
                this.node.children[0].active = false;
                callback?.();
            }, duration);

        }, 3);
    }
    // =============================

    private resetState() {

        this.unscheduleAllCallbacks();

        if (this.runningTween) {
            this.runningTween.stop();
            this.runningTween = null;
        }

        if (this.touchHandler) {
            this.node.off(Input.EventType.TOUCH_END, this.touchHandler, this);
            this.touchHandler = null;
        }

        this.currentValue = 0;
        this.isStopped = false;
    }
}
