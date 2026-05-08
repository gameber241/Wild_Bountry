import { _decorator, CCFloat, Component, director, Label, Node } from 'cc';
import { MessageBox } from './MessageBox';
import { PopEffect } from './PopEffect';
import { PanelBet } from './PanelBet';
import { currencyFormatSimple, GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('LabelBet')
export class LabelBet extends Component {

    @property(MessageBox)
    messageBox: MessageBox = null;

    @property(CCFloat)
    betAmount: number = 12;

    @property(CCFloat)
    stepBet: number = 4;

    @property(CCFloat)
    minBet: number = 4;

    @property(CCFloat)
    maxBet: number = 40;

    @property(Label)
    bet: Label = null

    protected start(): void {
        this.updateFromPanelBet();
    }


    protected onEnable(): void {
        this.bet = this.node.getComponent(Label)
        this.bet.string = GameManager.instance.betCurrent.toString()
        director.on("BET_CURRENT", this.UpdateBet, this)
    }

    UpdateBet(bet) {
        this.bet.string = bet.toString()

    }

    increaseBet() {
        const panel = PanelBet.instance;
        if (!panel) return;

        const list = panel.betAmounts;
        let index = list.indexOf(this.betAmount);

        if (index < list.length - 1) {
            index++;
            this.betAmount = list[index];
            this.messageBox.hideMessage();
        } else {
            this.messageBox.showMessage("Mức cược tối đa");
        }

        this.node.getComponent(PopEffect)?.play();
        this.updateLabel();
    }

    decreaseBet() {
        const panel = PanelBet.instance;
        if (!panel) return;

        const list = panel.betAmounts;
        let index = list.indexOf(this.betAmount);

        if (index > 0) {
            index--;
            this.betAmount = list[index];
            this.messageBox.hideMessage();
        } else {
            this.messageBox.showMessage("Mức cược tối thiểu");
        }

        this.node.getComponent(PopEffect)?.play();
        this.updateLabel();
    }

    updateFromPanelBet() {
        this.minBet = PanelBet.instance.minBet;
        this.maxBet = PanelBet.instance.maxBet;
        this.betAmount = PanelBet.instance.betAmount;
        this.stepBet = PanelBet.instance.betSize;
        this.node.getComponent(Label).string = currencyFormatSimple.format(this.betAmount);
    }

    updateLabel() {
        this.node.getComponent(Label).string = currencyFormatSimple.format(this.betAmount);
    }
}

