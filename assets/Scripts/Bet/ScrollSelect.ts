import { _decorator, CCFloat, CCInteger, Color, Component, instantiate, Label, Layout, Node, Prefab, ScrollView, setRandGenerator, UITransform, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScrollSelect')
export class ScrollSelect extends Component {

    @property([CCFloat])
    values: number[] = []

    @property(Prefab)
    prefabItem: Prefab;

    @property(CCInteger)
    digitFractor: number = 2;

    @property(CCFloat)
    itemHeight: number = 64;

    scrollView: ScrollView = null;

    _scrollSilent: boolean = false;

    protected onLoad(): void {
        this.scrollView = this.getComponent(ScrollView);
        this.scrollView.node.on(ScrollView.EventType.SCROLL_ENDED, this.onScrollViewEndScroll, this)
    }

    _items: Node[] = [];
    _contentHeight: number = 0;

    _index = 0;
    get index() {
        return this._index;
    }
    set index(_v) {
        this._index = _v;
        this.scrollToIndex(_v);
    }

    get value() {
        return this.values[this._index];
    }

    set value(_v: number) {
        this.scrollToValue(_v)
    }

    start() {
        this.regenerateValues();
        this.scrollToIndex(0)
    }

    scrollToIndex(id: number) {
        if (!this.scrollView) return;
        this.scrollView.scrollToOffset(v2(0, this.itemHeight * id), 0.25);
    }

    scrollToValue(value: number) {
        let id = this.values.indexOf(value)
        if (id > -1) {
            this.index = id;
        }
    }

    regenerateValues(isColor = false) {
        if (!this.prefabItem || !this.scrollView || !this.scrollView.content) return;

        this.scrollView.content.removeAllChildren();
        this._items = [];

        for (let i = 0; i < this.values.length; i++) {
            const item = instantiate(this.prefabItem);
            this.scrollView.content.addChild(item);
            item.name = `item_${i}`;
            item.position = v3(0, -this.itemHeight * i - this.itemHeight / 2, 0)
            const label = item.getComponent(Label);
            if (isColor == true)
                label.color = new Color(248, 210, 0)
            if (label) {
                label.string = this.values[i].toFixed(this.digitFractor);
            }
            this._items.push(item);
        }

        this._contentHeight = this.itemHeight * this.values.length + this.itemHeight / 2;
        this.scrollView.content.getComponent(UITransform).height = this._contentHeight;

        // const subfixItem = instantiate(this.prefabItem) as Node;
        // this.scrollView.content.addChild(subfixItem);
        // subfixItem.name = `prefix`;
        // subfixItem.getComponent(Label).string = "--";
        // subfixItem.position = v3(subfixItem.position.x, this.itemHeight / 2, 0);

        // const prefixItem = instantiate(this.prefabItem);
        // this.scrollView.content.addChild(prefixItem);
        // prefixItem.name = `prefix`;
        // prefixItem.getComponent(Label).string = "--";
        // prefixItem.position = v3(subfixItem.position.x, - this._contentHeight - this.itemHeight / 2, 0);

        this.scrollToIndex(0);
    }

    onScrollViewEndScroll(sv) {
        let yy = sv.getScrollOffset().y;
        let id = Math.round((yy / this._contentHeight) * this.values.length);
        if (id != this._index) {
            this.index = id;
            this.node.emit("value_changed", this.values[id], this);
        } else {
            this.scrollToIndex(id);
        }
    }
}

