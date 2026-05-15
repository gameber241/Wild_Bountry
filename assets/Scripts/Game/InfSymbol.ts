import { _decorator, Component, Label, Layout, Node } from 'cc';
import { Symbol } from '../Reels/Symbol';
import { SymbolPayoutConfig, SymbolType } from '../Enum/ESymbolFace';
const { ccclass, property } = _decorator;

@ccclass('InfSymbol')
export class InfSymbol extends Component {
    @property(Label)
    titleInf1: Label = null


    @property(Label)
    titleInf2: Label = null

    @property(Symbol)
    s: Symbol = null
    @property(Layout)
    containtNode: Layout = null

    @property(Node)
    numberNode: Node = null

    @property(Node)
    textWild: Node = null;

    @property(Node)
    textScratch: Node = null

    @property(Node)
    infNode: Node = null
    Show(data, woldPos) {
        console.log(woldPos)
        this.node.active = true;
        this.s.InitSymbol(data, false);
        // this.infNode.setWorldPosition(woldPos)
        this.titleInf1.string = SymbolPayoutConfig[this.s.face].count
        this.titleInf2.string = SymbolPayoutConfig[this.s.face].value

        if (this.s.face != SymbolType.WILD && this.s.face != SymbolType.SCRATCH) {
            this.textWild.active = false
            this.numberNode.active = true
            this.textScratch.active = false

            if (woldPos.x > 400) {
                this.containtNode.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
                this.infNode.setWorldPosition(woldPos.x - 80, woldPos.y, 0)

            }
            else {
                this.containtNode.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
                // this.containtNode.node.parent.setPosition(70, 0, 0)
                this.infNode.setWorldPosition(woldPos.x + 80, woldPos.y, 0)

            }

        }
        if (this.s.face == SymbolType.WILD) {
            this.textWild.active = true
            this.numberNode.active = false
            this.textScratch.active = false
            if (woldPos.x > 400) {
                this.containtNode.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
                // this.containtNode.node.parent.setPosition(-170, 0, 0)
                this.infNode.setWorldPosition(woldPos.x - 80, woldPos.y, 0)

            }
            else {
                this.containtNode.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
                // this.containtNode.node.parent.setPosition(172, 0, 0)
                this.infNode.setWorldPosition(woldPos.x + 80, woldPos.y, 0)

            }
        }
        if (this.s.face == SymbolType.SCRATCH) {
            this.textWild.active = false
            this.numberNode.active = false
            this.textScratch.active = true
            if (woldPos.x > 400) {
                this.containtNode.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
                this.infNode.setWorldPosition(woldPos.x - 80, woldPos.y, 0)

            }

            else {
                this.containtNode.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
                this.infNode.setWorldPosition(woldPos.x + 80, woldPos.y, 0)

            }
        }
    }

    hide() {
        this.node.active = false
    }

}

