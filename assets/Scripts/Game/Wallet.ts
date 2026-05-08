import { _decorator, Component, director, Label, Node } from 'cc';
import { UserInfo } from '../Server/UserInfo';
const { ccclass, property } = _decorator;

@ccclass('Wallet')
export class Wallet extends Component {
    @property(Label)
    walletLb: Label = null

    protected onEnable(): void {
        this.walletLb = this.node.getComponent(Label)
        this.walletLb.string = UserInfo.getInstance().balance.toString()
        director.on("UPDATE_BALLANCE", this.UpdateWallet, this)
    }

    UpdateWallet(ballance) {
        this.walletLb.string = ballance
    }

    protected onDisable(): void {
        director.off("UPDATE_BALLANCE", this.UpdateWallet, this)

    }
}


