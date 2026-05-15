import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { AudioManager } from '../Game/AudioManager';
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
            AudioManager.instance.UpdateSound(false)
        }
        else {
            this.isSound = true
            this.icon.spriteFrame = this.icons[1]
            AudioManager.instance.UpdateSound(true)

        }
    }
}

