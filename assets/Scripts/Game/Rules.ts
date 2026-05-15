import { _decorator, Button, Component, Node } from 'cc';
import { Spin } from './Spin';
const { ccclass, property } = _decorator;

@ccclass('Rules')
export class Rules extends Component {
    ShowRules() {
        this.node.active = true
    }

    HideRules() {
        this.node.active = false

    } protected update(dt: number): void {
        if (Spin.instance.isSpin == true) {
            this.node.getComponent(Button).enabled   = false
        }
        else {
            this.node.getComponent(Button).enabled   = true

        }
    }
}

