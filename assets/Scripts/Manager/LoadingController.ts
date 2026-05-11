import { _decorator, Component, ProgressBar, Label, Node, director } from 'cc';
import { AuthService } from '../Server/AuthService';
const { ccclass, property } = _decorator;

@ccclass('LoadingController')
export class LoadingController extends Component {

    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    @property(Node)
    startButton: Node = null!;

    @property(Label)
    statusLabel: Label = null;

    private targetProgress: number = 0;
    private currentProgress: number = 0;
    private isSceneReady: boolean = false;
    private isAuthReady: boolean = false;
    private hasNavigated: boolean = false;
    private canStart: boolean = false;

    start() {
        this.startButton.active = false;
        this.setStatus('Đang tải dữ liệu...');
        this.loadGameplay();
        void this.bootstrapLogin();
    }

    private loadGameplay() {
        director.preloadScene('Gameplay', (completedCount, totalCount) => {
            this.targetProgress = totalCount > 0 ? completedCount / totalCount : 0;
        }, () => {
            this.targetProgress = 1;
            this.isSceneReady = true;
            this.updateReadyState();
        });
    }

    update(dt: number) {
        if (this.currentProgress < this.targetProgress) {
            this.currentProgress += dt * 2;
            if (this.currentProgress > this.targetProgress) {
                this.currentProgress = this.targetProgress;
            }
        }

        this.progressBar.progress = this.currentProgress;
        this.updateReadyState();
    }

    private async bootstrapLogin(): Promise<void> {
        const tokenFromUrl = AuthService.getQueryParam('token');
        this.setStatus(tokenFromUrl ? 'Đang đăng nhập bằng token...' : 'Đang tự động đăng nhập...');

        try {
            await AuthService.ensureAuthenticated();
            this.isAuthReady = true;
            this.updateReadyState();
        } catch (error) {
            console.error('[Loading] Bootstrap login error:', error);
            this.setStatus(`Lỗi đăng nhập: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private updateReadyState(): void {
        this.canStart = this.isSceneReady && this.isAuthReady && this.currentProgress >= 1;
        this.startButton.active = this.canStart;
        this.progressBar.node.active = !this.canStart;

        if (this.canStart) {
            this.setStatus('Sẵn sàng. Nhấn Start để vào game');
        }
    }

    private tryEnterGameplay(): void {
        if (this.hasNavigated || !this.canStart) {
            return;
        }

        this.hasNavigated = true;
        director.loadScene('Gameplay');
    }

    private setStatus(message: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
    }

    onClickStart() {
        this.tryEnterGameplay();
    }
}
