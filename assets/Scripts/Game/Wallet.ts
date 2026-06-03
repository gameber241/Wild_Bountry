import { _decorator, Component, director, Label } from 'cc';
import { UserInfo } from '../Server/UserInfo';

const { ccclass, property } = _decorator;

@ccclass('Wallet')
export class Wallet extends Component {
    @property(Label)
    walletLb: Label = null;

    protected onEnable(): void {
        if (!this.walletLb) {
            this.walletLb = this.node.getComponent(Label);
        }

        this.UpdateWallet(UserInfo.getInstance().balance);

        director.on("UPDATE_BALLANCE", this.UpdateWallet, this);
    }

    private formatBalance(balance: any): string {
        const value = Number(balance);

        if (Number.isNaN(value)) {
            return "0.00";
        }

        return value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    UpdateWallet(balance: any) {
        const text = this.formatBalance(balance);

        console.log("[Wallet] update balance:", balance, "=>", text);

        this.walletLb.string = text;
    }

    protected onDisable(): void {
        director.off("UPDATE_BALLANCE", this.UpdateWallet, this);
    }
}