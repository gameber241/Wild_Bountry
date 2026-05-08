import { _decorator, Component, director, Label, Node } from 'cc';
import { GameManager } from '../Manager/GameManager';
const { ccclass, property } = _decorator;

@ccclass('Bet')
export class Bet extends Component {
    @property(Label)
    bet: Label = null

    protected onEnable(): void {
       

    }


}


