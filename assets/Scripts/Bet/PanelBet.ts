import { _decorator, CCFloat, Component, director, Label, Node } from 'cc';
import { ScrollSelect } from './ScrollSelect';
import { LabelBet } from './LabelBet';
import { currencyFormatSimple, GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('PanelBet')
export class PanelBet extends Component {
    static instance: PanelBet = null;
    static readonly DEFAULT_BET_AMOUNT = 0.8;

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
    private _hasInitializedBetState = false;

    get betAmounts() {
        if (this._betAmounts && this._betAmounts.length > 0) return this._betAmounts;
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

    static getInstance() {
        if (PanelBet.instance?.node?.isValid) {
            return PanelBet.instance;
        }

        const scene = director.getScene();
        if (!scene) {
            return null;
        }

        const queue: Node[] = [scene];
        while (queue.length > 0) {
            const node = queue.shift();
            const panel = node?.getComponent(PanelBet);
            if (panel) {
                PanelBet.instance = panel;
                return panel;
            }
            queue.push(...node.children);
        }

        return null;
    }

    public ensureBetState() {
        if (this.csBetSize) {
            this.csBetSize.values = this.betSizes;
        }

        if (this.csBetLevel) {
            this.csBetLevel.values = this.betLevels;
        }

        if (this.csBetBase) {
            this.csBetBase.values = [this.betBase];
        }

        this._betAmounts = null;
        if (this.csBetAmount) {
            this.csBetAmount.values = this.betAmounts;
        }

        if (this._hasInitializedBetState) return;

        this._hasInitializedBetState = true;
        this.onAmountChanged(PanelBet.DEFAULT_BET_AMOUNT);
        if (this.csBetAmount) {
            this.csBetAmount.value = PanelBet.DEFAULT_BET_AMOUNT;
        }
    }

    protected onLoad(): void {
        PanelBet.instance = this;
        this.ensureBetState();
    }

    constructor() {
        super();
    }

    start() {
        if (this.csBetSize) {
            this.csBetSize.node.on("value_changed", this.onBetChanged, this);
        }

        if (this.csBetLevel) {
            this.csBetLevel.node.on("value_changed", this.onBetChanged, this);
        }

        if (this.csBetBase) {
            this.csBetBase.node.on("value_changed", this.onBetChanged, this);
        }

        if (this.csBetAmount) {
            this.csBetAmount.node.on("value_changed", this.onAmountChanged, this);
        }
    }

    protected onEnable(): void {
        this.scheduleOnce(() => {
            this.initializeBetPanel();
            this.commitToLabelBet();
            this.syncGameManager();
        }, 0);
    }

    private initializeBetPanel() {
        this.ensureBetState();
        const currentAmount = this.betAmount;

        if (this.csBetSize) {
            this.csBetSize.regenerateValues();
        }

        if (this.csBetLevel) {
            this.csBetLevel.regenerateValues();
        }

        if (this.csBetBase) {
            this.csBetBase.regenerateValues();
        }

        if (this.csBetAmount) {
            this.csBetAmount.regenerateValues(true);
        }

        this.onAmountChanged(currentAmount);
        if (this.csBetAmount) {
            this.csBetAmount.value = currentAmount;
        }
    }

    getFromLabelBet() {
        this.csBetSize.scrollToValue(this.labelBet2.getComponent(LabelBet).stepBet)
        this.csBetLevel.scrollToValue(Math.floor(this.labelBet2.getComponent(LabelBet).betAmount / this.labelBet2.getComponent(LabelBet).stepBet));
    }

    commitToLabelBet() {
        this.syncGameManager();
    }

    onBetChanged(v, cs) {
        this.csBetAmount.value = this.csBetSize.value * this.csBetLevel.value * this.csBetBase.value;
        this.syncGameManager();
    }

    onAmountChanged(v) {
        for (let i = 0; i < this.betSizes.length; i++) {
            for (let j = 0; j < this.betLevels.length; j++) {
                let amount = this.betSizes[i] * this.betLevels[j] * this.betBase;
                if (amount == v) {
                    this.csBetSize.index = i;
                    this.csBetLevel.index = j;
                    this.syncGameManager();
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
        GameManager.instance.UpdateBetConfig(this.betAmount, this.betSize, this.betLevel, this.betBetbase)
    }

    private syncGameManager(): void {
        GameManager.instance?.UpdateBetConfig(this.betAmount, this.betSize, this.betLevel, this.betBetbase);
    }
}

