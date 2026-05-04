import { _decorator, Component, Input, Label, Node, sp, tween, Tween } from 'cc';
import { currencyFormatSimple, GameManager } from '../Manager/GameManager';
import { MultiplierCarouselFinal } from './MultiplierAnimator';
const { ccclass, property } = _decorator;

@ccclass('FreeSpines')
export class FreeSpines extends Component {
    public static instance: FreeSpines = null
    @property(sp.Skeleton)
    fx: sp.Skeleton = null

    @property(sp.Skeleton)
    totlSpines: sp.Skeleton = null

    @property(Label)
    totalLb: Label = null

    @property(Label)
    lbFreeSpin: Label = null

    @property(Node)
    btnStartFreeSpin: Node = null

    @property(sp.Skeleton)
    fxLoading: sp.Skeleton = null

    @property(Node)
    uiWaitFreeSpin: Node = null


    protected onLoad(): void {
        FreeSpines.instance = this
    }

    @property(Label)
    freeSpinLb: Label = null

    private currentValue: number = 0;
    private targetValue: number = 0;

    private tweenObj: { value: number } | null = null;
    private runningTween: Tween<any> | null = null;

    private touchHandler: Function | null = null;

    private isStopped: boolean = false;

    playAnimation(numberScratch) {
        this.fx.node.active = true
        this.fxLoading.setAnimation(0, "btn_circle", true)
        this.fx.setAnimation(0, "FreeWin_start", false)
        this.fx.addAnimation(0, "FreeWin_loop", true)
        this.freeSpinLb.string = numberScratch
        this.fx.setCompleteListener((tracking) => {
            if (tracking.animation.name != "FreeWin_start") return
            this.fx.setCompleteListener(null)
            this.startCheckFree()
            this.uiWaitFreeSpin.active = true
        });



    }

    private checkFreeTimer: any = null;

    startCheckFree() {
        this.checkFreeTimer = setInterval(() => {
            if (GameManager.instance.dataFreespin != null) {
                clearInterval(this.checkFreeTimer);
                this.checkFreeTimer = null;
                this.fxLoading.setAnimation(0, "btn_start_idle_click", true)

                // this.fx.addAnimation(0, "_FreeWin_Action", false)
                // this.fx.addAnimation(0, "_FreeWin_Action_Idle", false)
                this.btnStartFreeSpin.active = true

            }
        }, 100); // check mỗi 100ms
    }


    BtnStartSpin() {
        this.fx.addAnimation(0, "FreeWin_end", true)
        this.uiWaitFreeSpin.active = false

        this.fx.setCompleteListener((tracking) => {
            if (tracking.animation.name != "FreeWin_end") return
            this.fx.setCompleteListener(null)
            GameManager.instance.SetFreeSpines()
            this.btnStartFreeSpin.active = false
            GameManager.instance.indexCurrentReel = 0
            GameManager.instance.PlayModeFreeSpin()
            this.fx.node.active = false
            MultiplierCarouselFinal.instance.switchToScratchMode()  


        });

    }

    ShowTotalSpin(callback, target) {
        this.resetState();

        this.totlSpines.node.active = true
        this.totlSpines.setAnimation(0, "_TotalWin_Appear", false)
        this.totlSpines.addAnimation(0, "_TotalWin_Idle", true)

        this.playTo(target, 3, this.totalLb, callback)
        this.totlSpines.setCompleteListener((tracking) => {
            if (tracking.animation.name != "_TotalWin_Idle") return
            this.totlSpines.setCompleteListener(null)

            // this.scheduleOnce(() => {
            //     callback?.()
            // }, 2)
        });
    }


    private playTo(targetValue: number, duration: number, label: Label, callback: Function) {

        this.targetValue = targetValue;
        this.tweenObj = { value: this.currentValue };

        this.runningTween = tween(this.tweenObj)
            .to(duration, { value: targetValue }, {
                easing: "cubicOut",
                onUpdate: () => {
                    if (!this.tweenObj) return;
                    this.currentValue = this.tweenObj.value;
                    label.string = currencyFormatSimple.format(this.currentValue)
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

        this.fx.node.on(Input.EventType.TOUCH_END, this.touchHandler, this);
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

    private complete(label: Label, callback?: Function) {

        // remove event
        if (this.touchHandler) {
            this.fx.node.off(Input.EventType.TOUCH_END, this.touchHandler, this);
            this.touchHandler = null;
        }
        // delay hide giống slot
        this.scheduleOnce(() => {
            this.totlSpines.node.active = false; callback?.();
        }, 2);
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


    @property(Node)
    text1: Node = null

    @property(Node)
    text2: Node = null
    UpdateFreeSpinLb(round) {

        if (round == 0) {
            this.text2.active = true
            this.text1.active = false
            this.lbFreeSpin.node.active = false

        }
        else {
            this.lbFreeSpin.node.active = true
            this.text1.active = true
            this.text2.active = false

            this.lbFreeSpin.string = round

        }
    }


}

