import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BtnSound')
export class BtnSound extends Component {
    @property(Sprite)
    icon: Sprite = null

    @property(SpriteFrame)
    icons: SpriteFrame[] = []


    isSound = true;
    onClick() {
        if (this.isSound == true) {
            this.isSound = false
            this.icon.spriteFrame = this.icons[0]
        }
        else {
            this.isSound = true
            this.icon.spriteFrame = this.icons[1]
        }
    }
}

