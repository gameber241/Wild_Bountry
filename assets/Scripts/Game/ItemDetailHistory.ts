import { _decorator, Component, instantiate, Label, Node, Prefab } from 'cc';
import { currencyFormatSimple } from '../Manager/GameManager';
import { SymbolHis } from '../Reels/SymbolHis';
import { ItemWInDetailHistory } from '../Reels/ItemWInDetailHistory';

const { ccclass, property } = _decorator;

@ccclass('ItemDetailHistory')
export class ItemDetailHistory extends Component {
    @property(Label)
    Balance: Label = null

    @property(Label)
    transaction: Label = null

    @property(Label)
    bet: Label = null

    @property(Label)
    profit: Label = null

    @property(Node)
    reels: Node[] = []

    @property(Prefab)
    symbolHis: Prefab = null

    @property(Label)
    betSize: Label = null

    @property(Label)
    roundIndex: Label = null

    @property(Label)
    winMultipiler: Label = null

    @property(Node)
    contain: Node = null

    @property(Prefab)
    itemWInDetailHistory: Prefab = null

    SetUp(data, dataRound, index, maxIndex) {
        const roundWin = Number(data?.win?.stepWin ?? data?.stepWin ?? 0)
        const roundBet = index > 0 ? 0 : Number(dataRound?.bet ?? 0)
        const roundProfit = roundWin - roundBet

        this.roundIndex.string = (index + 1) + "/" + maxIndex
        this.betSize.string = currencyFormatSimple.format(Number(dataRound?.betSize ?? 0))
        this.bet.string = currencyFormatSimple.format(roundBet)
        this.transaction.string = dataRound.id
        this.profit.string = currencyFormatSimple.format(roundProfit)
        this.Balance.string = currencyFormatSimple.format(Number(dataRound?.balanceAfter ?? 0))
        console.log(data)
        data.grid.forEach((e, index) => {
            e.forEach((s) => {
                let item = instantiate(this.symbolHis)
                this.reels[index].addChild(item)
                item.getComponent(SymbolHis).InitSymbol(s)
            })
        })
        if (data.win.normal.length > 0) {
            this.winMultipiler.string = "Win Multiplier x " + data.multiplier
            let result = this.buildSummaryFromPositions(data.win.normal)
            for (const key in result) {
                const value = result[key]
                let item = instantiate(this.itemWInDetailHistory)
                this.contain.addChild(item)
                item.getComponent(ItemWInDetailHistory).SetUp(key, value)
            }
        }

        else {
            this.winMultipiler.string = "No win Multiplier"
        }

    }

    buildSummaryFromPositions(positions: { i: number }[]) {
        const result: Record<number, number> = {}

        for (const item of positions) {
            result[item.i] = (result[item.i] ?? 0) + 1
        }

        return result
    }
}

