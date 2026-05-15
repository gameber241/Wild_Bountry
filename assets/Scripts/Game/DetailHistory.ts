import { _decorator, Component, instantiate, Node, PageView, Prefab } from 'cc';
import { ItemDetailHistory } from './ItemDetailHistory';
const { ccclass, property } = _decorator;

@ccclass('DetailHistory')
export class DetailHistory extends Component {
    @property(PageView)
    pageDetail: PageView = null

    @property(Prefab)
    itemDetailhis: Prefab



    show(dataDetail) {
        this.pageDetail.removeAllPages()
        this.node.active = true
        console.log(dataDetail, "history")
        // dataDetail.replayRounds.forEach((e, index) => {
        //     let item = instantiate(this.itemDetailhis)
        //     this.pageDetail.addPage(item)
        //     item.getComponent(ItemDetailHistory).SetUp(e, dataDetail, index, dataDetail.replayRounds.length)
        // })

    }


    BtnClose() {
        this.node.active = false
    }
}

