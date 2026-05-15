import { _decorator, Button, Component, Node } from 'cc';
import { Spin } from '../Game/Spin';
const { ccclass, property } = _decorator;

@ccclass('BtnHistory')
export class BtnHistory extends Component {


    @property(Node)
    His: Node = null



    Click() {
        this.His.active = true
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

