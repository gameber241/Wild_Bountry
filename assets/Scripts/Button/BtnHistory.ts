import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BtnHistory')
export class BtnHistory extends Component {


    @property(Node)
    His: Node = null



    Click() {
        this.His.active = true
    }
}

