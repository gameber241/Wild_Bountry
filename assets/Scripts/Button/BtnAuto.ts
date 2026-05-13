import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BtnAuto')
export class BtnAuto extends Component {
    @property(Node)
    autoUI: Node = null;


    BtnClick() {
        this.autoUI.active = true;
    }
}


