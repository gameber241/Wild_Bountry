import { _decorator, Button, Color, Component, EventTouch, Label, Node, tween, UIOpacity, Vec2, Vec3 } from 'cc';
import { Spin } from './Spin';
const { ccclass, property } = _decorator;

@ccclass('AutoCtrl')
export class AutoCtrl extends Component {
    @property(Node)
    AutoBtns: Node[] = []

    @property(Button)
    btnAuto: Button = null

    @property(Node)
    bottom: Node = null

    show() {
        this.AutoBtns.forEach(e => {
            e.children[0].getComponent(Label).color = Color.WHITE
        })

        this.btnAuto.interactable = false
        this.btnAuto.node.getComponent(UIOpacity).opacity = 150


        this.node.active = true
        this.node.getComponent(UIOpacity).opacity = 0
        tween(this.node.getComponent(UIOpacity)).to(0.3, { opacity: 255 }).start()
        this.bottom.setPosition(0, -980)
        tween(this.bottom).to(0.3, { position: new Vec3(0, -458, 0) }).start()
    }

    btnClickAuto(target: EventTouch, args) {
        this.AutoBtns.forEach(e => {
            e.children[0].getComponent(Label).color = Color.WHITE
        })
        let x: Node = target.target.children[0]
        x.getComponent(Label).color = new Color(246, 186, 101)
        this.btnAuto.interactable = true
        this.btnAuto.node.getComponent(UIOpacity).opacity = 255
        this.countAuto = args


    }
    countAuto  = 0
    btnClose() {
        // this.node.getComponent(UIOpacity).opacity = 0
        tween(this.node.getComponent(UIOpacity)).to(0.3, { opacity: 0 })
            .call(() => {
                this.node.active = false

            })
            .start()
        // this.bottom.setPosition(0, -450)
        tween(this.bottom).to(0.3, { position: new Vec3(0, -980, 0) }).start()
    }

    BtnStartAuto() {
        this.btnClose()
        Spin.instance.PlayAuto(this.countAuto)
    }
}

