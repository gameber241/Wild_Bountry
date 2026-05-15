import { _decorator, Component, Tween, tween, UITransform, Sprite, Enum, Node, Vec2, SpriteFrame, Vec3, randomRangeInt, sp, size, Layers, Widget, Color, Game, Label, Input, director, Layout, Size } from 'cc';
import { SymbolFrameState } from '../Enum/SymbolFrameState';
import { ReelBase } from './ReelBase';
import { SymbolType } from '../Enum/ESymbolFace';
import { SymbolCell } from './SymbolCell';
import { GameManager } from '../Manager/GameManager';


const { ccclass, property, executeInEditMode } = _decorator;



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

@ccclass('SymbolHis')
@executeInEditMode(true)

export class SymbolHis extends Component {

    @property({ type: Enum(SymbolType) })
    face: SymbolType = SymbolType.A;
    frameState = ""
    @property(sp.Skeleton) icon: sp.Skeleton = null!;
    @property(sp.Skeleton) frame: sp.Skeleton = null!;
    reel: ReelBase = null!;
    @property(Number)
    reelIndex: number = 0;


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
        if (this.frameState == "g") {
            this.frame.setSkin("Gold_Frame")
        }
        this.frame?.setAnimation(0, name, loop);

    }

    UpdateFrame() {
        if (this.frameState == "g") {
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



    InitSymbol(data) {
        this.isInit = true;
        this.face = data.i;
        this.frameState = data.t;
        this.SetUISymbolNormal();
    }
}
