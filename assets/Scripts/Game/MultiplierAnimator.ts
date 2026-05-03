import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween, Label, UIOpacity, Color, Font } from 'cc';
const { ccclass, property } = _decorator;

// ===== MODE =====
enum MultiplierMode {
    NORMAL = 0,
    SPECIAL = 1
}

@ccclass('MultiplierCarouselFinal')
export class MultiplierCarouselFinal extends Component {
    public static instance: MultiplierCarouselFinal = null

    @property(Prefab)
    itemPrefab: Prefab = null!;

    @property(Node)
    container: Node = null!;

    @property
    startValue: number = 1;

    @property
    maxValue: number = 1024;

    @property({ type: MultiplierMode })
    mode: MultiplierMode = MultiplierMode.NORMAL;

    @property([Font])
    fonts: Font[] = [];

    @property([Color])
    colors: Color[] = [
        new Color(180, 180, 180, 255),
        new Color(220, 220, 220, 255),
        new Color(255, 215, 0, 255), // center
        new Color(220, 220, 220, 255),
        new Color(180, 180, 180, 255),
    ];

    private nodes: Node[] = [];
    private currentCenter: number = 1;

    // ===== UI =====
    private positions = [
        new Vec3(-260, 31, 0),
        new Vec3(-140, -5, 0),
        new Vec3(0, -17, 0),
        new Vec3(140, 5, 0),
        new Vec3(260, 37, 0)
    ];

    private scales = [0.4, 0.5, 1, 0.5, 0.4];
    private rotations = [-25, -15, 0, 15, 25];
    private opacities = [120, 200, 255, 200, 120];

    // ===== GET MIN =====
    private getMinValue(): number {
        return this.mode === MultiplierMode.NORMAL ? 1 : 8;
    }

    onLoad() {
        MultiplierCarouselFinal.instance = this;
        this.init();
        this.AnimStart()
    }

    AnimStart() {
        this.node.position = new Vec3(0, 1222)

        this.scheduleOnce(() => {
            tween(this.node)
                .delay(0.5)
                .to(1, { position: new Vec3(0, 782.674) }, { easing: "backInOut" })
                .call(() => {
                    // this.switchToScratchMode()
                })
                .start()
        }, 0.5)
    }

    // ================= INIT =================
    private init() {

        this.currentCenter = this.getMinValue();

        const values = this.buildValues();

        for (let i = 0; i < 5; i++) {
            const node = this.createItem();
            this.setValue(node, values[i]);
            this.setState(node, i, true, values[i]);
            this.nodes.push(node);
        }
    }

    // ================= VALUE =================
    private buildValues(): number[] {

        const c = this.currentCenter;
        const MAX = this.maxValue;
        const MIN = this.getMinValue();

        const arr = new Array(5);

        arr[2] = c;

        // 👉 bên phải
        arr[3] = c * 2 > MAX ? MIN : c * 2;
        arr[4] = arr[3] * 2 > MAX ? MIN : arr[3] * 2;

        // 👉 bên trái
        arr[1] = c / 2 < MIN ? MAX : c / 2;
        arr[0] = arr[1] / 2 < MIN ? MAX / 2 : arr[1] / 2;

        return arr;
    }

    private setValue(node: Node, value: number) {
        node["value"] = value;
        const label = node.getComponentInChildren(Label);
        if (label) label.string = "X" + value;
    }

    private createItem(): Node {
        const node = instantiate(this.itemPrefab);
        node.setParent(this.container);

        let op = node.getComponent(UIOpacity);
        if (!op) op = node.addComponent(UIOpacity);

        return node;
    }

    // ================= STATE =================
    private setState(node: Node, index: number, instant: boolean, value: number) {

        const pos = this.positions[index];
        const scale = this.scales[index];
        const rot = this.rotations[index];
        const opacity = this.opacities[index];

        const op = node.getComponent(UIOpacity)!;

        const label = node.getComponentInChildren(Label);

        if (label) {
            label.font = value < 1024 ? this.fonts[1] : this.fonts[0];
        }

        // VFX center
        const vfx = node.children[0];
        if (vfx) {
            vfx.active = (index === 2);
        }

        if (instant) {
            node.setPosition(pos);
            node.setScale(scale, scale, 1);
            node.setRotationFromEuler(0, 0, rot);
            op.opacity = opacity;
        } else {
            tween(node)
                .to(0.35, {
                    position: pos,
                    scale: new Vec3(scale, scale, 1),
                    eulerAngles: new Vec3(0, 0, rot)
                }, { easing: 'cubicOut' })
                .start();

            tween(op).to(0.35, { opacity }).start();
        }

        node.setSiblingIndex(index);
    }

    // ================= NEXT =================
    public next() {

        const MIN = this.getMinValue();

        let newValue = this.currentCenter * 2;
        if (newValue > this.maxValue) newValue = MIN;

        this.currentCenter = newValue;

        const first = this.nodes.shift();
        first?.destroy();

        const newNode = this.createItem();
        this.setValue(newNode, newValue);

        newNode.setPosition(this.positions[4].clone().add(new Vec3(150, 0, 0)));
        newNode.setScale(0.4, 0.4, 1);
        newNode.setRotationFromEuler(0, 0, 25);

        const op = newNode.getComponent(UIOpacity)!;
        op.opacity = 0;

        this.nodes.push(newNode);

        const values = this.buildValues();

        for (let i = 0; i < this.nodes.length; i++) {
            this.setValue(this.nodes[i], values[i]);
            this.setState(this.nodes[i], i, false, values[i]);
        }
    }

    // ================= FOCUS =================
    public focusTo(target: number) {

        if (target === this.currentCenter) return;

        const MIN = this.getMinValue();

        const steps: number[] = [];
        let temp = this.currentCenter;

        while (temp !== target) {
            temp = temp * 2;
            if (temp > this.maxValue) temp = MIN;

            steps.push(temp);

            if (steps.length > 20) break;
        }

        let delay = 0;

        steps.forEach(() => {
            this.scheduleOnce(() => {
                this.next();
            }, delay);

            delay += 0.15;
        });
    }

    // ================= RESET =================
    public resetCombo() {
        this.currentCenter = this.getMinValue();

        const values = this.buildValues();

        for (let i = 0; i < this.nodes.length; i++) {
            this.setValue(this.nodes[i], values[i]);
            this.setState(this.nodes[i], i, false, values[i]);
        }
    }

    public getCenterNode(): Node | null {
        if (!this.nodes || this.nodes.length < 3) return null;
        return this.nodes[2];
    }

    public switchToScratchMode() {
        tween(this.node).to(1, { position: new Vec3(0, 430) }, { easing: "backInOut" })
            .call(() => {
                const TARGET = 8;

                // 👉 nếu đã ở 8 rồi
                if (this.currentCenter === TARGET) {
                    this.mode = MultiplierMode.SPECIAL; // ✅ FIX: set mode
                    this.applyScratchLayout();
                    return;
                }

                const steps: number[] = [];
                let temp = this.currentCenter;

                // 👉 build path theo mode hiện tại (thường là NORMAL)
                while (temp !== TARGET) {
                    temp = temp * 2;

                    if (temp > this.maxValue) temp = this.getMinValue();

                    steps.push(temp);

                    if (steps.length > 20) break;
                }

                let delay = 0;

                steps.forEach((value, index) => {
                    this.scheduleOnce(() => {
                        this.next()
                        // 👉 bước cuối
                        if (index === steps.length - 1) {
                            this.scheduleOnce(() => {
                                // ✅ QUAN TRỌNG: đổi mode tại đây
                                this.mode = MultiplierMode.SPECIAL;
                                tween(this.node)
                                    .delay(0.5)
                                    .to(1, { position: new Vec3(0, 782.674) }, { easing: "backInOut" }).start()
                                this.applyScratchLayout();
                                this
                            }, 0.5);
                        }

                    }, delay);

                    delay += 0.15;
                });
            })
            .start()

    }

    private applyScratchLayout() {

        // 👉 đảm bảo center = 8
        this.currentCenter = 8;

        // layout chuẩn scratch:
        // [512, 1024, 8, 16, 32]

        const values = [512, 1024, 8, 16, 32];

        for (let i = 0; i < this.nodes.length; i++) {
            this.setValue(this.nodes[i], values[i]);
            this.setState(this.nodes[i], i, false, values[i]);
        }
    }
}