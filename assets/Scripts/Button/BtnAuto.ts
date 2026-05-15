import { _decorator, Button, Component, Node } from 'cc';
import { Spin } from '../Game/Spin';
import { AutoCtrl } from '../Game/AutoCtrl';
const { ccclass, property } = _decorator;

@ccclass('BtnAuto')
export class BtnAuto extends Component {
    @property(Node)
    autoUI: Node = null;


    BtnClick() {
        this.autoUI.getComponent(AutoCtrl).show()
    }


    protected update(dt: number): void {
        if (Spin.instance.isSpin == true) {
            this.node.getComponent(Button).enabled = false
        }
        else {
            this.node.getComponent(Button).enabled = true

        }
    }
}


