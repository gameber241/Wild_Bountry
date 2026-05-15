import { _decorator, Component, Prefab, ScrollView, Node, Label, instantiate } from 'cc';
import { DetailHistory } from './DetailHistory';
import { NetworkService } from '../Server/NetworkService';
import { ItemHistory } from './ItemHistory';
const { ccclass, property } = _decorator;

type HistoryQuery = {
    limit?: number
    offset?: number
    skip?: number
    sort?: string
    dateFrom?: string
    dateTo?: string
}

@ccclass('History')
export class History extends Component {

    @property(Prefab)
    itemHis: Prefab = null

    @property(ScrollView)
    scrollHis: ScrollView = null

    @property(DetailHistory)
    detailHistory: DetailHistory = null

    @property(Node)
    selectTime: Node = null

    @property(Node)
    selectTimeCustom: Node = null

    @property(Node)
    loading: Node = null

    @property(Label)
    title: Label = null

    public logs: any[] = []
    public isLoading = false

    protected onEnable(): void {
        this.UpdateLogDay();
    }

    btnClose() {
        this.node.active = false
    }

    show() {
        this.node.active = true;
    }

    UpdateLogDay() {
        this.title.string = 'Today'
        const today = new Date();
        void this.loadHistoryDemo({
            limit: 15,
            offset: 0,
            sort: 't.desc',
            dateFrom: this.toStartOfDayIso(today),
            dateTo: this.toEndOfDayIso(today)
        })
    }

    UpdateLog7dayCustom() {
        this.title.string = 'Last 7 days'

        const today = new Date();
        const from = new Date();
        from.setDate(today.getDate() - 6);

        void this.loadHistoryDemo({
            limit: 15,
            offset: 0,
            sort: 't.desc',
            dateFrom: this.toStartOfDayIso(from),
            dateTo: this.toEndOfDayIso(today)
        });
    }

    public async loadHistoryDemo(data: HistoryQuery) {
        this.loading.active = true
        this.scrollHis.content.destroyAllChildren()
        const wsService = NetworkService.getInstance();
        if (!wsService.hasToken()) {
            this.logs = []
            console.warn('[History] Missing session token, skip loading history');
            return;
        }

        this.isLoading = true

        try {
            const logsResult = await wsService.getLogs(data);
            const logs = logsResult?.logs || logsResult?.data || logsResult?.items || [];
            this.logs = Array.isArray(logs) ? logs : [];
            console.log('[History] Loaded logs:', this.logs.length, this.logs);
            this.loading.active = false
            this.logs.forEach(e => {
                let item = instantiate(this.itemHis)
                this.scrollHis.content.addChild(item)
                item.getComponent(ItemHistory).SetUp(e)
                console.log("den day")
            })
            // const firstLogId = this.logs[0]?.id;
            // if (firstLogId) {
            //     try {
            //         const detailResult = await this.loadLogDetail(firstLogId);
            //         const detailLog = detailResult?.log || detailResult?.data || detailResult;
            //         console.log('[History] First log detail:', firstLogId, detailLog);

            //     } catch (detailError) {
            //         console.error('[History] Failed to load first log detail:', firstLogId, detailError);
            //     }
            // }
        } catch (error) {
            this.logs = []
            console.error('[History] Failed to load history:', error);
        } finally {
            this.isLoading = false
        }
    }

    public async loadLogDetail(logId: string) {
        const wsService = NetworkService.getInstance();
        return wsService.getLogDetail(logId);
    }

    ShowDetail(data: any) {
        this.detailHistory.show(data)
    }

    BtnSelectTime() {
        this.selectTime.active = true
    }

    private toStartOfDayIso(date: Date): string {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value.toISOString();
    }

    private toEndOfDayIso(date: Date): string {
        const value = new Date(date);
        value.setHours(23, 59, 59, 999);
        return value.toISOString();
    }
}

