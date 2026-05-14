import { _decorator, Component, Label, Node, Prefab, instantiate } from 'cc';
import { History } from './History';
import { GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

enum ESelectType {
    YEAR,
    MONTH,
    DAY
}

@ccclass('SelectDate')
export class SelectDate extends Component {

    @property(Label) yearStart: Label = null;
    @property(Label) yearEnd: Label = null;

    @property(Label) MonthStart: Label = null;
    @property(Label) MonthEnd: Label = null;

    @property(Label) DayStart: Label = null;
    @property(Label) DayEnd: Label = null;

    @property(Node) containtYearStart: Node = null;
    @property(Node) containtMonthStart: Node = null;
    @property(Node) containtDayStart: Node = null;

    @property(Node) containtYearEnd: Node = null;
    @property(Node) containtMonthEnd: Node = null;
    @property(Node) containtDayEnd: Node = null;

    @property(Prefab) boxTime: Prefab = null;

    protected onEnable(): void {
        this.init();
    }

    init() {
        const now = new Date();

        this.setStartDate(now);
        this.setEndDate(now);

        this.clearAll();
        this.hideAll();

        const year = now.getFullYear();

        this.genYears(this.containtYearStart, year, true);
        this.genYears(this.containtYearEnd, year, false);

        this.genMonths(this.containtMonthStart, true);
        this.genMonths(this.containtMonthEnd, false);

        this.genDays(this.containtDayStart, true);
        this.genDays(this.containtDayEnd, false);
    }

    // ===== YEARS =====
    genYears(parent: Node, currentYear: number, isStart: boolean) {
        parent.removeAllChildren();
        const years = [currentYear, currentYear - 1];
        for (let y of years) {
            this.createItem(parent, `${y}`, ESelectType.YEAR, isStart);
        }
    }

    // ===== MONTHS (NO FUTURE) =====
    genMonths(parent: Node, isStart: boolean) {
        parent.removeAllChildren();

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const selectedYear = isStart
            ? Number(this.yearStart.string)
            : Number(this.yearEnd.string);

        let maxMonth = 12;

        if (selectedYear === currentYear) {
            maxMonth = currentMonth;
        }

        for (let m = maxMonth; m >= 1; m--) {
            this.createItem(parent, this.format(m), ESelectType.MONTH, isStart);
        }
    }

    // ===== DAYS (NO FUTURE) =====
    genDays(parent: Node, isStart: boolean) {
        parent.removeAllChildren();

        const now = new Date();

        const year = isStart
            ? Number(this.yearStart.string)
            : Number(this.yearEnd.string);

        const month = isStart
            ? Number(this.MonthStart.string)
            : Number(this.MonthEnd.string);

        let maxDay = new Date(year, month, 0).getDate();

        if (
            year === now.getFullYear() &&
            month === (now.getMonth() + 1)
        ) {
            maxDay = now.getDate();
        }

        for (let d = maxDay; d >= 1; d--) {
            this.createItem(parent, this.format(d), ESelectType.DAY, isStart);
        }
    }

    // ===== CREATE ITEM =====
    createItem(parent: Node, value: string, type: ESelectType, isStart: boolean) {
        const item = instantiate(this.boxTime);
        item.setParent(parent);

        const label = item.getComponentInChildren(Label);
        if (label) label.string = value;

        item.on(Node.EventType.TOUCH_END, () => {
            this.onSelect(value, type, isStart);
        });
    }

    // ===== SELECT =====
    onSelect(value: string, type: ESelectType, isStart: boolean) {

        if (isStart) {

            if (type === ESelectType.YEAR) {
                this.yearStart.string = value;
                this.genMonths(this.containtMonthStart, true);
                this.updateDayToEndOfMonth(true);
            }

            if (type === ESelectType.MONTH) {
                this.MonthStart.string = value;
                this.updateDayToEndOfMonth(true);
            }

            if (type === ESelectType.DAY) {
                this.DayStart.string = value;
            }

        } else {

            if (type === ESelectType.YEAR) {
                this.yearEnd.string = value;
                this.genMonths(this.containtMonthEnd, false);
                this.updateDayToEndOfMonth(false);
            }

            if (type === ESelectType.MONTH) {
                this.MonthEnd.string = value;
                this.updateDayToEndOfMonth(false);
            }

            if (type === ESelectType.DAY) {
                this.DayEnd.string = value;
            }
        }

        // 🔥 regen days
        if (type === ESelectType.YEAR || type === ESelectType.MONTH) {
            if (isStart) this.genDays(this.containtDayStart, true);
            else this.genDays(this.containtDayEnd, false);
        }

        this.validateRange(isStart);
        this.hideAll();
    }

    // ===== SET DAY = END OF MONTH =====
    updateDayToEndOfMonth(isStart: boolean) {
        const year = isStart
            ? Number(this.yearStart.string)
            : Number(this.yearEnd.string);

        const month = isStart
            ? Number(this.MonthStart.string)
            : Number(this.MonthEnd.string);

        let maxDay = new Date(year, month, 0).getDate();

        const now = new Date();

        if (
            year === now.getFullYear() &&
            month === (now.getMonth() + 1)
        ) {
            maxDay = now.getDate();
        }

        if (isStart) this.DayStart.string = this.format(maxDay);
        else this.DayEnd.string = this.format(maxDay);
    }

    // ===== VALIDATE =====
    validateRange(isStart: boolean) {
        const start = this.getStartDate();
        const end = this.getEndDate();

        if (!start || !end) return;

        if (start.getTime() > end.getTime()) {
            if (isStart) this.setEndDate(start);
            else this.setStartDate(end);
        }
    }

    getStartDate(): Date {
        return new Date(
            Number(this.yearStart.string),
            Number(this.MonthStart.string) - 1,
            Number(this.DayStart.string)
        );
    }

    getEndDate(): Date {
        return new Date(
            Number(this.yearEnd.string),
            Number(this.MonthEnd.string) - 1,
            Number(this.DayEnd.string)
        );
    }

    setStartDate(date: Date) {
        this.yearStart.string = `${date.getFullYear()}`;
        this.MonthStart.string = this.format(date.getMonth() + 1);
        this.DayStart.string = this.format(date.getDate());
    }

    setEndDate(date: Date) {
        this.yearEnd.string = `${date.getFullYear()}`;
        this.MonthEnd.string = this.format(date.getMonth() + 1);
        this.DayEnd.string = this.format(date.getDate());
    }

    // ===== UI =====
    onClickYearStart() { this.open(ESelectType.YEAR, true); }
    onClickMonthStart() { this.open(ESelectType.MONTH, true); }
    onClickDayStart() { this.open(ESelectType.DAY, true); }

    onClickYearEnd() { this.open(ESelectType.YEAR, false); }
    onClickMonthEnd() { this.open(ESelectType.MONTH, false); }
    onClickDayEnd() { this.open(ESelectType.DAY, false); }

    open(type: ESelectType, isStart: boolean) {
        this.showOnly(type, isStart);
    }

    showOnly(type: ESelectType, isStart: boolean) {
        const year = isStart ? this.containtYearStart : this.containtYearEnd;
        const month = isStart ? this.containtMonthStart : this.containtMonthEnd;
        const day = isStart ? this.containtDayStart : this.containtDayEnd;

        year.active = type === ESelectType.YEAR;
        month.active = type === ESelectType.MONTH;
        day.active = type === ESelectType.DAY;
    }

    hideAll() {
        this.containtYearStart.active = false;
        this.containtMonthStart.active = false;
        this.containtDayStart.active = false;

        this.containtYearEnd.active = false;
        this.containtMonthEnd.active = false;
        this.containtDayEnd.active = false;
    }

    clearAll() {
        this.containtYearStart.removeAllChildren();
        this.containtMonthStart.removeAllChildren();
        this.containtDayStart.removeAllChildren();

        this.containtYearEnd.removeAllChildren();
        this.containtMonthEnd.removeAllChildren();
        this.containtDayEnd.removeAllChildren();
    }

    format(n: number): string {
        return n < 10 ? `0${n}` : `${n}`;
    }

    // ===== CONFIRM =====
    BtnConfirm() {
        const start = this.getStartDate();
        const end = this.getEndDate();

        const format = (d: Date) =>
            `${d.getFullYear()}-${this.format(d.getMonth() + 1)}-${this.format(d.getDate())}`;

        // GameManager.instance.history.getComponent(H_story).loadHistoryDemo({
        //     limit: 25,
        //     offset: 0,
        //     sort: 't.desc',
        //     dateFrom: format(start),
        //     dateTo: format(end),
        // });
        const format1 = (d: Date) =>
            `${d.getFullYear()}/${this.format(d.getMonth() + 1)}/${this.format(d.getDate())}`;
        this.node.active = false;
        // GameManager.instance.history.getComponent(H_story).title.string = format1(start) + "-" + format1(end),
        //     GameManager.instance.history.getComponent(H_story).selectTime.active = false;
    }

    BtnClose() {
        this.node.active = false;
    }
}