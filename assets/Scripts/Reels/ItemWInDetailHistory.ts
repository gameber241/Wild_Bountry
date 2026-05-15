import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { SymbolHis } from './SymbolHis';
const { ccclass, property } = _decorator;

@ccclass('ItemWInDetailHistory')
export class ItemWInDetailHistory extends Component {
    @property(SymbolHis)
    sym: SymbolHis = null

    @property(Label)
    title1: Label = null

    SetUp(data, quantity) {
        this.sym.InitSymbol({ i: data, t: "n" })
        this.title1.string = quantity + " of a Kind"
    }
}


