import { _decorator, Button, Component, Node } from 'cc';
import { Spin } from '../Game/Spin';
const { ccclass, property } = _decorator;

@ccclass('BtnBet')
export class BtnBet extends Component {
    @property(Node)
    betUI: Node = null

    onClick() {
        // if (Spin.instance.isSpin == true) return;
        this.betUI.active = true;
    }

    protected update(dt: number): void {
        if (Spin.instance.isSpin == true) {
            this.node.getComponent(Button).interactable = false
        }
        else {
            this.node.getComponent(Button).interactable = true

        }
    }
}


