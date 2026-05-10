import { _decorator, Component, Node, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BtnOption')
export class BtnOption extends Component {
    @property(Node)
    btnNode: Node = null

    @property(Node)
    optionSetting: Node = null


    protected start(): void {

    }

    onClick() {
        this.btnNode.setPosition(0, -517.624, 0);
        this.btnNode.getComponent(UIOpacity).opacity = 255
        tween(this.btnNode).to(0.2, { position: new Vec3(0, -762.248, 0) }).start();
        tween(this.btnNode.getComponent(UIOpacity)).to(0.2, { opacity: 0 }).start();

        this.optionSetting.getComponent(UIOpacity).opacity = 0
        this.optionSetting.setPosition(0, -764.856, 0)
        tween(this.optionSetting.getComponent(UIOpacity)).to(0.2, { opacity: 255 }).start();
        tween(this.optionSetting).to(0.2, { position: new Vec3(0, -517.624, 0) }).start();

    }

    BtnCloseOption() {
        this.optionSetting.setPosition(0, -517.624, 0);
        this.optionSetting.getComponent(UIOpacity).opacity = 255
        tween(this.optionSetting).to(0.2, { position: new Vec3(0, -762.248, 0) }).start();
        tween(this.optionSetting.getComponent(UIOpacity)).to(0.2, { opacity: 0 }).start();

        this.btnNode.getComponent(UIOpacity).opacity = 0
        this.btnNode.setPosition(0, -764.856, 0)
        tween(this.btnNode.getComponent(UIOpacity)).to(0.2, { opacity: 255 }).start();
        tween(this.btnNode).to(0.2, { position: new Vec3(0, -517.624, 0) }).start();

    }

}

