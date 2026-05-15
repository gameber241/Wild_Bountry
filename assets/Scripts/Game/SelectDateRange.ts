import { _decorator, Color, Component, Label, Node } from 'cc';
import { History } from './History';
import { GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('SelectDateRange')
export class SelectDateRange extends Component {
    @property(Node)
    button: Node[] = []


    btnClick(target, args) {
        this.node.active = false
        this.button.forEach(e => {
            e.children[0].getComponent(Label).color = Color.WHITE
        })

        target.target.children[0].getComponent(Label).color = new Color(246, 186, 101)
        console.log(args)
        switch (Number(args)) {
            case 0:
                this.node.active = false
                GameManager.instance.his.getComponent(History).UpdateLogDay();
                this.node.active = false

                break
            case 1:
                GameManager.instance.his.getComponent(History).UpdateLog7dayCustom();
                this.node.active = false

                break
            case 2:
                GameManager.instance.his.getComponent(History).selectTimeCustom.active = true;
                break
        }
    }
}


