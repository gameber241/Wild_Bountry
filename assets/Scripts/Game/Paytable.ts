import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Paytable')
export class Paytable extends Component {
    BtnShow() {
        this.node.active = true
    }

    BtnHide() {
        this.node.active = false
    }
}

