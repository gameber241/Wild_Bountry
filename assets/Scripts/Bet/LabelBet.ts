import { _decorator, CCFloat, Component, director, Label, Node } from 'cc';
import { MessageBox } from './MessageBox';
import { PopEffect } from './PopEffect';
import { PanelBet } from './PanelBet';
import { currencyFormatSimple, GameManager } from '../Manager/GameManager';
import { Spin } from '../Game/Spin';
const { ccclass, property } = _decorator;

@ccclass('LabelBet')
export class LabelBet extends Component {

    @property(MessageBox)
    messageBox: MessageBox = null;

    @property(Label)
    bet: Label = null

    protected start(): void {
        this.bet = this.node.getComponent(Label);
    }

    protected onEnable(): void {
        director.on("BET_CURRENT", this.UpdateBet, this);
        this.scheduleOnce(() => {
            this.updateFromPanelBet();
        }, 0);
    }

    protected onDisable(): void {
        director.off("BET_CURRENT", this.UpdateBet, this);
    }

    UpdateBet(bet) {
        if (this.bet) {
            this.bet.string = currencyFormatSimple.format(Number(bet))
        }
    }

    increaseBet() {
        if (Spin.instance.isSpin == true) return
        const panel = PanelBet.getInstance();
        if (!panel) return;

        panel.ensureBetState();
        const list = panel.betAmounts;
        const currentAmount = panel.betAmount;
        let currentIndex = list.indexOf(currentAmount);

        // Nếu không tìm thấy, tìm giá trị gần nhất
        if (currentIndex === -1) {
            let closest = 0;
            let minDiff = Math.abs(list[0] - currentAmount);
            for (let i = 1; i < list.length; i++) {
                const diff = Math.abs(list[i] - currentAmount);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = i;
                }
            }
            currentIndex = closest;
        }

        if (currentIndex < list.length - 1) {
            const newAmount = list[currentIndex + 1];
            panel.onAmountChanged(newAmount);
            this.messageBox.hideMessage();
        } else {
            this.messageBox.showMessage("Mức cược tối đa");
        }

        this.node.getComponent(PopEffect)?.play();
    }

    decreaseBet() {
        if (Spin.instance.isSpin == true) return
        const panel = PanelBet.getInstance();
        if (!panel) return;

        panel.ensureBetState();
        const list = panel.betAmounts;
        const currentAmount = panel.betAmount;
        let currentIndex = list.indexOf(currentAmount);

        // Nếu không tìm thấy, tìm giá trị gần nhất
        if (currentIndex === -1) {
            let closest = 0;
            let minDiff = Math.abs(list[0] - currentAmount);
            for (let i = 1; i < list.length; i++) {
                const diff = Math.abs(list[i] - currentAmount);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = i;
                }
            }
            currentIndex = closest;
        }

        if (currentIndex > 0) {
            const newAmount = list[currentIndex - 1];
            panel.onAmountChanged(newAmount);
            this.messageBox.hideMessage();
        } else {
            this.messageBox.showMessage("Mức cược tối thiểu");
        }

        this.node.getComponent(PopEffect)?.play();
    }

    updateFromPanelBet() {
        const panel = PanelBet.getInstance();
        if (!panel || !this.bet) return;

        panel.ensureBetState();
        this.bet.string = currencyFormatSimple.format(panel.betAmount);
    }
}

