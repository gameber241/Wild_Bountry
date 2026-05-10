import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Rules')
export class Rules extends Component {
    ShowRules() {
        this.node.active = true
    }

    HideRules() {
        this.node.active = false

    }
}

