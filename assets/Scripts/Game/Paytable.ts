import { _decorator, Button, Component, Node } from 'cc';
import { Spin } from './Spin';
const { ccclass, property } = _decorator;

@ccclass('Paytable')
export class Paytable extends Component {
    BtnShow() {
        this.node.active = true
    }

    BtnHide() {
        this.node.active = false
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

