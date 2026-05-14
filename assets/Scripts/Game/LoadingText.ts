import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingText')
export class LoadingText extends Component {

    @property(Label)
    label: Label = null!;

    private dotCount: number = 0;

    onEnable() {
        this.dotCount = 0;
        this.schedule(this.updateLoading, 0.1);
    }

    onDisable() {
        this.unschedule(this.updateLoading); // stop đúng function
    }

    updateLoading() {
        this.dotCount++;
        if (this.dotCount > 3) this.dotCount = 1;

        this.label.string = `Đang tải${'.'.repeat(this.dotCount)}`;
    }
}