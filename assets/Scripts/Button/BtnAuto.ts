import { _decorator, Button, Component, Node } from 'cc';
import { Spin } from '../Game/Spin';
const { ccclass, property } = _decorator;

@ccclass('BtnAuto')
export class BtnAuto extends Component {
    @property(Node)
    autoUI: Node = null;


    BtnClick() {
        this.autoUI.active = true;
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


