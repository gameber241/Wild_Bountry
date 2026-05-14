import { _decorator, Component, Node } from 'cc';
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
}


