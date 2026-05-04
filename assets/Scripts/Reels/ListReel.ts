import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
import { ReelVertical } from './ReelVertical';
const { ccclass, property } = _decorator;

@ccclass('ListReel')
export class ListReel extends Component {
    public static instance: ListReel = null

    @property(Node)
    containSymbol: Node = null
    reels: ReelVertical[] = []

    @property(Node)
    maskEffect: Node = null;

    @property(Node)
    vfxLight: Node = null


    protected onLoad(): void {
        ListReel.instance = this
    }

    protected start(): void {
        for (let i = 0; i < 6; i++) {
            let reel = new ReelVertical()
            reel.possitionReel = i
            this.SetUpReel(reel, i)
            reel.init(this.containSymbol)
            this.reels.push(reel)
        }
    }


    SetUpReel(reel: ReelVertical, index: number) {
        switch (index) {
            case 0:
                reel.posX = -297
                reel.FIRST_VISIBLE = 3;
                reel.VISIBLE_COUNT = 3
                reel.numberSymbols = 9
                reel.symbolPadding = 20
                break;
            case 1:
                reel.posX = -176
                reel.FIRST_VISIBLE = 4;
                reel.VISIBLE_COUNT = 4
                reel.numberSymbols = 12
                reel.symbolPadding = 20
                break;
            case 2:
                reel.posX = -60
                reel.FIRST_VISIBLE = 5;
                reel.VISIBLE_COUNT = 5
                reel.numberSymbols = 15

                break;
            case 3:
                reel.posX = 60
                reel.FIRST_VISIBLE = 5;
                reel.VISIBLE_COUNT = 5
                reel.numberSymbols = 15

                break;
            case 4:
                reel.posX = 176
                reel.FIRST_VISIBLE = 4;
                reel.VISIBLE_COUNT = 4
                reel.numberSymbols = 12
                reel.symbolPadding = 20

                break;
            case 5:
                reel.posX = 297
                reel.FIRST_VISIBLE = 3;
                reel.VISIBLE_COUNT = 3
                reel.numberSymbols = 9
                reel.symbolPadding = 20
                break;
        }
    }


    ShowVfxLight(indexReel) {
        let posX = 0
        switch (indexReel) {
            case 0:
                posX = -296
                break;
            case 1:
                posX = -177
                break;
            case 2:
                posX = -58
                break;
            case 3:
                posX = 58
                break;
            case 4:
                posX = 177
                break;
            case 5:
                posX = 296
                break;
        }
        let opacity = this.vfxLight.getComponent(UIOpacity)
        opacity.opacity = 0;
        this.vfxLight.active = true
        this.vfxLight.setPosition(posX, -32, 0)

        tween(opacity).to(0.5, { opacity: 255 }).start()
    }
    HideVfxLight() {
        let opacity = this.vfxLight.getComponent(UIOpacity)
        opacity.opacity = 255
        tween(opacity).to(0.5, { opacity: 0 })
            .call(() => {
                this.vfxLight.active = false
            })
            .start()
    }

    ShowMaskEffect() {
        this.maskEffect.setSiblingIndex(91)
        this.maskEffect.active = true
        let opacity = this.maskEffect.getComponent(UIOpacity)
        opacity.opacity = 0;
        tween(opacity).to(0.5, { opacity: 255 }).start()

    }

    HideMaskEffect() {
        let opacity = this.maskEffect.getComponent(UIOpacity)
        opacity.opacity = 255
        tween(opacity).to(0.5, { opacity: 0 })
            .call(() => {
                this.maskEffect.active = false
            })
            .start()
    }

}

