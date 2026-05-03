import { _decorator, Component, Tween, tween, UITransform, Sprite, Enum, Node, Vec2, SpriteFrame, Vec3, randomRangeInt, sp, size, Layers, Widget, Color, Game, Label, Input, director, Layout, Size } from 'cc';
import { SymbolFrameState } from '../Enum/SymbolFrameState';
import { ReelBase } from './ReelBase';
import { SymbolType } from '../Enum/ESymbolFace';
import { SymbolCell } from './SymbolCell';
import { GameManager } from '../Manager/GameManager';


const { ccclass, property, executeInEditMode } = _decorator;

export enum StateSymbol {
    IDLE = 0,
    MOVE = 1,
    ACTION = 2,
    ACTION_IDLE = 3,
    UPDATE = 4,
    WIN = 5
}



const SymbolAnim = {
    WILD: {
        idle: ["Icon_Wild_idle"],
        move: ["Icon_Wild_move"],
        action: ["Icon_Wild_leave"],
        win: ["Icon_Wild_win"]
    },
    SCRATCH: {
        idle: ["Icon_Scatter_idle"],
        move: ["Icon_Scatter_move"],
        action: ["Icon_Scatter_hit  "],
        win: ["Icon_Scatter_win"]
    },
    DEFAULT: {
        idle: ["Icon_idle"],
        move: ["Icon_move"],
        action: ["Icon_hit"],
        win: ["Icon_win"]
    },
    FRAME: {
        idle: ["Icon_idle"],
        move: ["Icon_move"],
    }
};

@ccclass('Symbol')
@executeInEditMode(true)

export class Symbol extends Component {

    @property({ type: Enum(SymbolType) })
    face: SymbolType = SymbolType.A;

    @property({ type: Enum(SymbolFrameState) })
    frameState: SymbolFrameState = SymbolFrameState.NORMAL;
    @property(sp.Skeleton) icon: sp.Skeleton = null!;
    @property(sp.Skeleton) frame: sp.Skeleton = null!;
    reel: ReelBase = null!;
    reelIndex = 0;


    col = 0; row = 0
    isInit = false;


    uiTransform: UITransform = null;

    static MoveType = {
        'START': 'start',
        'STOP': 'stop',
        'MOVING': 'moving'
    } as const
    private SkinMap = {
        [SymbolType.Cowboy]: "Icon5",
        [SymbolType.Gun]: "Icon6",
        [SymbolType.Hat]: "Icon7",
        [SymbolType.Bottle]: "Icon8",
        [SymbolType.A]: "Icon1",
        [SymbolType.K]: "Icon2",
        [SymbolType.Q]: "Icon3",
        [SymbolType.J]: "Icon4",

    };


    protected start() {
        director.on("HIDE_INF", this.hideInf, this)
    }

    hideInf() {
        // this.infNode.active = false
    }

    private getAnim(type: "idle" | "move" | "action" | "win"): string {

        let cfg = SymbolAnim.DEFAULT;
        if (this.face === SymbolType.WILD) cfg = SymbolAnim.WILD;
        if (this.face === SymbolType.SCRATCH) cfg = SymbolAnim.SCRATCH;

        return cfg[type]?.[0] ?? "";
    }

    getNameIdle() { return this.getAnim("idle"); }
    getNameMove() { return this.getAnim("move"); }
    getNameAction() { return this.getAnim("action"); }
    getNameWin() { return this.getAnim("win"); }

    SetSkin() {
        this.icon.setSkin(this.SkinMap[this.face] ?? "default");

    }

    EnabledAniamtion(enable: boolean) {
        this.icon.enabled = enable;
    }

    playiconAnimation(name: string, loop: boolean) {
        this.SetSkin();
        this.EnabledAniamtion(true);
        this.icon.setAnimation(0, name, loop);

    }

    addAnimation(name: string, loop: boolean) {
        if (name) this.icon.addAnimation(0, name, loop);
    }

    playFrameAnimation(name: string, loop: boolean) {
        if (this.frameState == SymbolFrameState.GOLD) {
            this.frame.setSkin("Gold_Frame")
        }
        this.frame?.setAnimation(0, name, loop);

    }

    UpdateFrame() {
        if (this.frameState == SymbolFrameState.GOLD) {
            console.log("den day")
            this.frame.enabled = true
            this.playFrameAnimation(this.getNameIdle(), true);

        }
        else {
            this.frame.enabled = false
        }

    }

    SetUISymbolNormal() {
        this.UpdateFrame();
        this.playiconAnimation(this.getNameIdle(), true);
        this.playFrameAnimation(this.getNameIdle(), true)
    }

    SetUiMove() {
        const name = this.getNameMove();
        this.playiconAnimation(name, true);
        this.playFrameAnimation(name, true);
    }

    InitSymbol(data: SymbolCell) {
        console.log(data)
        this.isInit = true;
        this.face = data.i;
        this.frameState = data.f;


        this.SetUISymbolNormal();
        this.icon.node.off(Input.EventType.TOUCH_END, this.ShowInf, this)
        this.icon.node.on(Input.EventType.TOUCH_END, this.ShowInf, this)
    }

    ResetSymbol() {
        this.setRandomFace();
        this.SetUISymbolNormal();

    }

    setRandomFace() {
        const faces = [
            SymbolType.Cowboy,
            SymbolType.Gun,
            SymbolType.Hat,
            // SymbolType.GOLDEN_IDOL,
            SymbolType.Bottle,
            SymbolType.A,
            SymbolType.K,
            SymbolType.Q,
            SymbolType.J,
        ];
        this.face = faces[Math.floor(Math.random() * faces.length)];
        this.frameState = SymbolFrameState.NORMAL;
        this.icon.node.off(Input.EventType.TOUCH_END, this.ShowInf, this)

    }

    rollToIndex(time: number = 0.2, type: string = Symbol.MoveType.MOVING) {

        const newPosition = this.reel.getSymbolPosition(this.reelIndex);

        // ❗ CHỈ stop tween khi STOP, không stop khi MOVING
        if (type === Symbol.MoveType.STOP) {
            Tween.stopAllByTarget(this.node);
        }
        if (type === Symbol.MoveType.MOVING) {
            this.SetUiMove()
        }
        const easingType =
            type === Symbol.MoveType.MOVING
                ? "linear"
                : "cubicOut";

        return tween(this.node)
            .to(time, { position: newPosition }, { easing: easingType })
            .call(() => {

                this.reelIndex =
                    this.reelIndex % this.reel.symbols.length;

                if (type === Symbol.MoveType.STOP) {
                    this.exploAnim();
                }

            })
            .start();
    }


    DropToindex(time: number = 0.2) {
        if (!this.reel) return;

        const newPosition = this.reel.getSymbolPosition(this.reelIndex);
        Tween.stopAllByTarget(this.node);
        return tween(this.node)
            .to(time, { position: newPosition })
            .call(() => {
                this.exploAnim()
            })
            .start();
    }



    exploAnim(bounce = 2) {
        const basePos = this.reel.getSymbolPosition(this.reelIndex);
        const isHorizontal = this.reel.isHorizontal();

        const upPos = isHorizontal
            ? basePos.clone().add3f(bounce, 0, 0)
            : basePos.clone().add3f(0, bounce, 0);

        tween(this.node)
            .set({ position: basePos })
            .to(0.08, { position: upPos }, { easing: 'sineOut' })
            .to(0.08, { position: basePos }, { easing: 'sineIn' })
            .call(() => {
                if (this.isInit == false) {
                    this.node.active = false
                }
                const animNameIdle = this.getNameIdle()
                this.playiconAnimation(animNameIdle, true)
                if (this.face == SymbolType.SCRATCH || this.face == SymbolType.WILD) {
                    this.node.setSiblingIndex(90)
                }
            })
            .start();
    }

    snapToGrid() {
        const cellHeight = 84; // hoặc this.height nếu bạn lưu
        const y = this.node.position.y;

        const snappedY = Math.round(y / cellHeight) * cellHeight;

        this.node.setPosition(
            this.node.position.x,
            snappedY,
            this.node.position.z
        );
    }
    FlipSymbol(data) {
        this.AnimationWin()
        this.isInit = true;
        this.face = data.i;
        this.frameState = data.f;
        this.UpdateFrame();
        tween(this.icon.node)
            .to(0.1, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.playiconAnimation(this.getNameIdle(), true);
            })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start()
    }

    Dispose() {
        this.node.setSiblingIndex(100)
        this.playiconAnimation(this.getNameWin(), false);
        this.scheduleOnce(() => {
            director.off("HIDE_INF", this.hideInf, this)
            const idx = this.reel.listSymbol.findIndex(e => e === this.node);
            console.log(this.reel.listSymbol, idx)
            if (idx !== -1) {
                this.reel.listSymbol.splice(idx, 1);
            }
            this.node.destroy();
            GameManager.instance.symBolArray[this.col][this.row] = null
        }, 1);


    }

    HideAll() { this.EnabledAniamtion(false); }

    PlayIdleScratch() {

        // const name = this.stackSize === 1
        //     ? "Icon_Scatter_small_action_idle"
        //     : "Icon_Scatter_big_action_idle";

        // this.playiconAnimation(name, true);
    }


    ShowMask() {
        this.icon.color = new Color(158, 158, 158, 255)
        this.frame.color = new Color(158, 158, 158, 255)
    }


    AnimationWin() {
        tween(this.icon).to(0.1, { color: new Color(255, 255, 255, 255) }).start()
        tween(this.frame).to(0.1, { color: new Color(255, 255, 255, 255) }).start()

    }


    // @property(Label)
    // titleInf1: Label = null


    // @property(Label)
    // titleInf2: Label = null

    // @property(sp.Skeleton) iconInf: sp.Skeleton = null!;
    // @property(sp.Skeleton) frameInf: sp.Skeleton = null!;

    // @property(Node)
    // infNode: Node = null

    // @property(Node)
    // bg: Node = null

    // @property(Node)
    // frane: Node = null

    // @property(Layout)
    // containtNode: Layout = null

    // @property(Node)
    // numberNode: Node = null

    // @property(Node)
    // textWild: Node = null;

    // @property(Node)
    // textScratch: Node = null

    ShowInf() {
        // if (Spin.instance.isAuto == true) return
        // if (Spin.instance.isSpin == true) return
        // GameManager.instance.maskInf.active = true
        // this.infNode.active = true
        // this.titleInf1.string = SymbolPayoutConfig[this.face].count
        // this.titleInf2.string = SymbolPayoutConfig[this.face].value

        // this.iconInf.setSkin(this.SkinMap[this.face] ?? "default");
        // this.iconInf.setAnimation(0, this.getNameIdle(), true)



        // if (this.face != Symbol.WILD && this.face != Symbol.SCRATCH) {
        //     this.textWild.active = false
        //     this.numberNode.active = true
        //     this.textScratch.active = false
        //     this.bg.getComponent(UITransform).setContentSize(300, 100 * this.stackSize + 30)
        //     this.frane.getComponent(UITransform).setContentSize(300, 100 * this.stackSize + 30)

        //     if (this.node.worldPosition.x > 400) {
        //         this.containtNode.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
        //         this.containtNode.node.parent.setPosition(-70, 0, 0)
        //     }
        //     else {
        //         this.containtNode.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        //         this.containtNode.node.parent.setPosition(70, 0, 0)
        //     }

        // }
        // if (this.face == Symbol.WILD) {
        //     this.textWild.active = true
        //     this.numberNode.active = false
        //     this.textScratch.active = false
        //     this.bg.getComponent(UITransform).setContentSize(500, 100 * this.stackSize + 30)
        //     this.frane.getComponent(UITransform).setContentSize(500, 100 * this.stackSize + 30)
        //     if (this.node.worldPosition.x > 400) {
        //         this.containtNode.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
        //         this.containtNode.node.parent.setPosition(-170, 0, 0)
        //     }
        //     else {
        //         this.containtNode.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        //         this.containtNode.node.parent.setPosition(172, 0, 0)
        //     }
        // }
        // if (this.face == Symbol.SCRATCH) {
        //     this.textWild.active = false
        //     this.numberNode.active = false
        //     this.textScratch.active = true
        //     this.bg.getComponent(UITransform).setContentSize(600, 100 * this.stackSize + 30)
        //     this.frane.getComponent(UITransform).setContentSize(600, 100 * this.stackSize + 30)
        //     if (this.node.worldPosition.x > 400) {
        //         this.containtNode.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
        //         this.containtNode.node.parent.setPosition(-225, 0, 0)
        //     }
        //     else {
        //         this.containtNode.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        //         this.containtNode.node.parent.setPosition(225, 0, 0)
        //     }
        // }

        // if (this.frameState == SymbolFrameState.SILVER) {
        //     this.frameInf.setSkin("Border_Silver")

        // }

        // if (this.frameState == SymbolFrameState.GOLD) {
        //     this.frameInf.setSkin("Border_Gold")
        // }

        // this.frameInf.setAnimation(0, this.getNameIdle(), true)

    }


    public shakeNode() {
        const originalPos = this.node.position.clone();

        const offset = 10; // độ lệch (px)
        const duration = 0.05;

        tween(this.node)
            .to(duration, { position: new Vec3(originalPos.x - offset, originalPos.y, 0) })
            .to(duration, { position: new Vec3(originalPos.x + offset, originalPos.y, 0) })
            .to(duration, { position: new Vec3(originalPos.x - offset, originalPos.y, 0) })
            .to(duration, { position: new Vec3(originalPos.x + offset, originalPos.y, 0) })
            .to(duration, { position: originalPos }) // về vị trí cũ
            .start();
    }
}
