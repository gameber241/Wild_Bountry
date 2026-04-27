import { _decorator, UITransform, v3 } from 'cc';
import { ReelBase } from './ReelBase';
const { ccclass, property } = _decorator;

@ccclass('ReelVertical')
export class ReelVertical extends ReelBase {
    @property(Number)
    public VISIBLE_COUNT: number = 5;
    @property(Number)
    public FIRST_VISIBLE: number = 5
    posX;
    public getCellSize(ui: UITransform): number {
        return ui.contentSize.height;
    }

    public computeHalfSize() {
        this.halfSize = this.totalSize * 0.5;
    }


    public getSymbolPosition(i: number) {
        return v3(
            this.posX,
            this.halfSize - (i + 0.5) * this.cellSize - 1,
            0
        );
    }

    public sortSibling() {
        this.symbols.sort((a, b) => a.node.position.y - b.node.position.y);
        this.symbols.forEach((s, i) => s.node.setSiblingIndex(i));
    }
    public override isHorizontal(): boolean { return false; }

}
