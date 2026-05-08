import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('BtnTurbo')
export class BtnTurbo extends Component {
    @property(Sprite)
    icon: Sprite = null;

    @property(SpriteFrame)
    icons: SpriteFrame[] = []

    onClick() {
        if (GameManager.instance.turboMode == 0) {
            GameManager.instance.turboMode = 1
            this.icon.spriteFrame = this.icons[0]
        }
        else {
            GameManager.instance.turboMode = 0
            this.icon.spriteFrame = this.icons[1]
        }
    }
}


