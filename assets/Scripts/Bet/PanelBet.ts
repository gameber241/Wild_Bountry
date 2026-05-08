import { _decorator, CCFloat, Component, Label, labelAssembler, math } from 'cc';
import { ScrollSelect } from './ScrollSelect';
import { LabelBet } from './LabelBet';
import { currencyFormatSimple, GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('PanelBet')
export class PanelBet extends Component {
    static instance: PanelBet = null;

    @property(ScrollSelect)
    csBetSize: ScrollSelect = null;

    @property(ScrollSelect)
    csBetLevel: ScrollSelect = null;

    @property(ScrollSelect)
    csBetBase: ScrollSelect = null;

    @property(ScrollSelect)
    csBetAmount: ScrollSelect = null;

    @property([CCFloat])
    betSizes: number[] = [];

    @property([CCFloat])
    betLevels: number[] = [];

    @property(CCFloat)
    betBase: number;

    @property(Label)
    labelBet2: Label = null;

    get betSize() {
        return this.csBetSize ? this.csBetSize.value : this.betSizes[0];
    }

    get betLevel() {
        return this.csBetLevel ? this.csBetLevel.value : this.betLevels[0];
    }

    set betLevel(v) {
        if (this.csBetLevel)
            this.csBetLevel.scrollToValue(v);
    }

    get betBetbase() {
        return this.csBetBase ? this.csBetBase.value : this.betBase;
    }

    get betAmount() {
        return this.betSize * this.betLevel * this.betBase;
    }

    get minBet() {
        return this.betSize * this.betLevels[0] * this.betBase;
    }

    get maxBet() {
        return this.betSize * this.betLevels[this.betLevels.length - 1] * this.betBase;
    }

    _betAmounts: number[] = null;
    get betAmounts() {
        if (this._betAmounts != null) return this._betAmounts;
        if (!this.betLevels || !this.betSizes) return [];
        this._betAmounts = [];
        for (let i = 0; i < this.betSizes.length; i++) {
            for (let j = 0; j < this.betLevels.length; j++) {
                let amount = this.betSizes[i] * this.betLevels[j] * this.betBase;
                if (this._betAmounts.indexOf(amount) == -1)
                    this._betAmounts.push(amount)
            }
        }

        this._betAmounts = this._betAmounts.sort((a, b) => a - b);
        return this._betAmounts;
    }

    protected onLoad(): void {
        this.commitToLabelBet();
    }

    constructor() {
        super();
        PanelBet.instance = this;
    }

    start() {
        this.csBetSize.values = this.betSizes;
        this.csBetSize.regenerateValues();
        this.csBetSize.node.on("value_changed", this.onBetChanged, this)

        this.csBetLevel.values = this.betLevels;
        this.csBetLevel.regenerateValues();
        this.csBetLevel.node.on("value_changed", this.onBetChanged, this)

        this.csBetBase.values = [this.betBase];
        this.csBetBase.regenerateValues();
        this.csBetBase.node.on("value_changed", this.onBetChanged, this)

        this.csBetAmount.values = this.betAmounts;
        this.csBetAmount.regenerateValues();
        this.csBetAmount.node.on("value_changed", this.onAmountChanged, this)

        this.commitToLabelBet();

    }

    protected onEnable(): void {

    }

    getFromLabelBet() {
        this.csBetSize.scrollToValue(this.labelBet2.getComponent(LabelBet).stepBet)
        this.csBetLevel.scrollToValue(Math.floor(this.labelBet2.getComponent(LabelBet).betAmount / this.labelBet2.getComponent(LabelBet).stepBet));
    }

    commitToLabelBet() {
        // this.labelBet.updateFromPanelBet();
    }

    onBetChanged(v, cs) {
        this.csBetAmount.value = this.csBetSize.value * this.csBetLevel.value * this.csBetBase.value;
    }

    onAmountChanged(v) {
        for (let i = 0; i < this.betSizes.length; i++) {
            for (let j = 0; j < this.betLevels.length; j++) {
                let amount = this.betSizes[i] * this.betLevels[j] * this.betBase;
                if (amount == v) {
                    this.csBetSize.index = i;
                    this.csBetLevel.index = j;
                    return;
                }
            }
        }
    }

    setMax() {
        this.csBetAmount.scrollToIndex(this.csBetAmount.values.length - 1)
    }

    open() {
        this.node.active = true;
    }

    close() {
        this.node.active = false;
    }

    BtnXacNhan() {
        this.labelBet2.string = currencyFormatSimple.format(this.betAmount)
        GameManager.instance.UpdateBetCurrent(this.betAmount)
    }
}

