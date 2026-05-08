import { _decorator, Component, Label, Node } from 'cc';
import { PopEffect } from './PopEffect';
const { ccclass, property } = _decorator;

@ccclass('MessageBox')
export class MessageBox extends Component {
    @property(Label)
    label: Label = null;

    @property(Boolean)
    visibleOnStart: boolean = false;

    protected onLoad(): void {
        this.node.active = this.visibleOnStart;
    }

    showMessage(message: string) {
        this.label.string = message;
        this.node.active = true;
        this.node.getComponent(PopEffect).play();
    }

    hideMessage() {
        this.node.active = false;
    }
}

