import { _decorator, Component, Node, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopEffect')
export class PopEffect extends Component {
    play() {
        tween(this.node)
            // .set({ scale: 1.0 })
            .to(0.1, { scale: v3(1.2, 1.2, 1.2) })
            .to(0.1, { scale: v3(1.0, 1.0, 1.0) })
            .start();
    }
}

