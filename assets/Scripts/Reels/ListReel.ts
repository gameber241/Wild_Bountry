import { _decorator, Component, Node } from 'cc';
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

    ShowMaskEffect() {
        this.maskEffect.setSiblingIndex(99)
        this.scheduleOnce(() => {
            this.maskEffect.active = true
        })
    }

    HideMaskEffect() {
        this.maskEffect.active = false
    }

}

