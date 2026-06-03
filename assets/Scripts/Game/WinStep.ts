import { _decorator, Component, director, Label } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('WinStep')
export class WinStep extends Component {
    @property(Label)
    winStep: Label = null;

    protected onEnable(): void {
        if (!this.winStep) {
            this.winStep = this.node.getComponent(Label);
        }

        this.UpdateStepWin(0);

        director.on("UPDATE_STEPWIN", this.UpdateStepWin, this);
    }

    private formatWin(stepWin: any): string {
        const value = Number(stepWin);

        if (Number.isNaN(value)) {
            return "0.00";
        }

        return value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    UpdateStepWin(stepWin: any) {
        const text = this.formatWin(stepWin);

        console.log("[WinStep] update:", stepWin, "=>", text);

        this.winStep.string = text;
    }

    protected onDisable(): void {
        director.off("UPDATE_STEPWIN", this.UpdateStepWin, this);
    }
}