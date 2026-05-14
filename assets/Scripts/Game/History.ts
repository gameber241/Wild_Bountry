import { _decorator, Component, instantiate, Prefab, ScrollView, Node, Label } from 'cc';
import { DetailHistory } from './DetailHistory';
import { NetworkService } from '../Server/NetworkService';
const { ccclass, property } = _decorator;
const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
@ccclass('H_story')
export class H_story extends Component {

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
    uiHis: Node = null
    @property(Label)
    title: Label = null

    btnClose() {
        this.node.active = false
    }

    async show() {
        console.log('[History] show() called');
        this.node.active = true;
        await this.UpdateLogDay();
    }



    UpdateLogDay() {
        this.title.string = "Today"
        const logsPayload = {
            limit: 15,
            offset: 0,
            sort: 't.desc',
            datePreset: 'today'
        };
        this.loadHistoryDemo(logsPayload)
    }


    UpdateLog7dayCustom() {
        this.title.string = "Last 7 days"

        const today = new Date();
        const from = new Date();
        from.setDate(today.getDate() - 6);

        const format = (d: Date) =>
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

        this.loadHistoryDemo({
            limit: 15,
            offset: 0,
            sort: 't.desc',
            dateFrom: format(from),
            dateTo: format(today)
        });
    }

    public async loadHistoryDemo(data) {
        // this.uiHis.active = true
        // const wsService = NetworkService.getInstance();
        // if (!wsService) {
        //     console.warn('[History] WebSocketService not found');
        //     this.uiHis.active = false
        //     return;
        // }

        // if (!this.scrollHis) {
        //     console.error('[History] scrollHis is null. Please bind ScrollView in Inspector.');
        //     this.uiHis.active = false
        //     return;
        // }

        // if (!this.scrollHis.content) {
        //     console.error('[History] scrollHis.content is null. Please set ScrollView content node.');
        //     this.uiHis.active = false

        //     return;
        // }

        // if (!this.itemHis) {
        //     console.error('[History] itemHis prefab is null. Please bind item prefab in Inspector.');
        //     this.uiHis.active = false
        //     return;
        // }

        // try {
        //     this.scrollHis.content.removeAllChildren();
        //     const logsPayload = data
        //     const logsResult = await wsService.getLogs(logsPayload);

        //     const logs = logsResult?.logs || logsResult?.data || logsResult?.items || [];
        //     if (!Array.isArray(logs) || logs.length === 0) {
        //         this.uiHis.active = false
        //         return;
        //     }


        //     const detailResults: any[] = [];
        //     for (const logItem of logs) {
        //         try {
        //             if (!logItem?.id) {
        //                 console.warn('[History] Skip log without id:', logItem);
        //                 detailResults.push(logItem);
        //                 continue;
        //             }

        //             console.log('[History] Requesting getLogDetail for id:', logItem.id);
        //             const detailResult = await wsService.getLogDetail(logItem.id);

        //             console.log('[History] getLogDetailResult:', logItem.id, detailResult);

        //             const detailLog = detailResult?.log || detailResult?.data || detailResult;
        //             const mergedEntry = {
        //                 ...logItem,
        //                 detail: detailLog,
        //                 replayRounds: detailLog?.replayRounds,
        //                 rounds: detailLog?.replayRounds || detailLog?.rounds || logItem?.rounds,
        //             };

        //             detailResults.push(mergedEntry);
        //         } catch (detailError) {
        //             console.error('[History] Failed to get log detail:', logItem?.id, detailError);
        //             detailResults.push(logItem);
        //             this.uiHis.active = false

        //         }
        //     }

        //     console.log('[History] Rendering history entries:', detailResults.length, detailResults);

        //     detailResults.forEach((entry, index) => {
        //         try {
        //             const item = instantiate(this.itemHis);
        //             this.scrollHis.content.addChild(item);
        //             const itemHistory = item.getComponent(ItemHistory);
        //             itemHistory.SetUp(entry);
        //             console.log('[History] Rendered entry:', index, entry?.id, {
        //                 hasDetail: Boolean(entry?.detail),
        //                 replayRounds: entry?.replayRounds?.length ?? 0,
        //             });

        //             this.uiHis.active = false

        //         } catch (renderError) {
        //             this.uiHis.active = false

        //             console.error('[History] Failed to render entry at index:', index, renderError);
        //         }
        //     });
        // } catch (error) {
        //     this.uiHis.active = false

        //     console.error('[History] Failed to load history demo:', error);
        // }
    }

    ShowDetail(data) {
        this.detailHistory.show(data)
    }


    BtnSelectTime() {
        this.selectTime.active = true
    }
}

