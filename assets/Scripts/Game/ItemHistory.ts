import { _decorator, Component, EventTouch, Input, Label, Node } from 'cc';
import { currencyFormatSimple, GameManager } from '../Manager/GameManager';
import { NetworkService } from '../Server/NetworkService';
const { ccclass, property } = _decorator;

@ccclass('ItemHistory')
export class ItemHistory extends Component {
    @property(Label)
    timeStem: Label = null

    @property(Label)
    transaction: Label = null

    @property(Label)
    bet: Label = null

    @property(Label)
    profit: Label = null

    data = null
    SetUp(data) {
        this.data = data
        const betAmount = Number(data?.bet ?? 0)
        const profitAmount = Number(data?.win ?? 0) - betAmount

        this.timeStem.string = this.formatFull(data.timestamp)
        this.bet.string = currencyFormatSimple.format(betAmount)
        this.transaction.string = data.id
        this.profit.string = currencyFormatSimple.format(profitAmount)

        this.node.on(Input.EventType.TOUCH_START, this.TouchStart, this)
        this.node.on(Input.EventType.TOUCH_MOVE, this.TouchMove, this)
        this.node.on(Input.EventType.TOUCH_END, this.TouchEnd, this)


    }

    TouchStart(event: EventTouch) {

    }

    TouchMove(event: EventTouch) {
        if (Math.abs(event.getDeltaY()) > 2) {
            event.propagationStopped = true
        }
    }

    TouchEnd(event: EventTouch) {
        this.Btn()
    }

    pad2(n: number): string {
        return n < 10 ? "0" + n : "" + n
    }

    formatFull(isoTime: string) {
        const d = new Date(isoTime)

        const hh = this.pad2(d.getHours())
        const mm = this.pad2(d.getMinutes())
        const ss = this.pad2(d.getSeconds())

        const month = this.pad2(d.getMonth() + 1)
        const day = this.pad2(d.getDate())

        return `${hh}:${mm}:${ss}\n${month}/${day}`
    }


    async Btn() {
        const wsService = NetworkService.getInstance();
        const detailResult = await wsService.getLogDetail(this.data.id);
        GameManager.instance.his.ShowDetail(detailResult)
    }
}

