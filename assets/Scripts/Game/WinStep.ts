import { _decorator, Component, director, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WinStep')
export class WinStep extends Component {
    @property(Label)
    winStep: Label = null

    protected onEnable(): void {
        this.winStep = this.node.getComponent(Label)
        director.on("UPDATE_STEPWIN", this.UpdateStepWin, this)
    }

    UpdateStepWin(stepWin) {
        this.winStep.string = stepWin
    }

    protected onDisable(): void {
        director.off("UPDATE_STEPWIN", this.UpdateStepWin, this)

    }

}


