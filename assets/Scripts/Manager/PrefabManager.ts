import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PrefabManager')
export class PrefabManager extends Component {
    public static instance: PrefabManager = null

    onLoad() {
        PrefabManager.instance = this
    }

    // @property({ type: Prefab })
    // dataSymbls: Prefab = null

    @property(Prefab)
    symbolPrefab: Prefab = null

    // datasymbolNode: Node = null
    // public GetDataSymbol() {
    //     if (this.datasymbolNode == null) {
    //         this.datasymbolNode = instantiate(this.dataSymbls)
    //         this.node.addChild(this.datasymbolNode)

    //     }

    //     return this.datasymbolNode.getComponent(ListDataSymbol)
    // }
}

