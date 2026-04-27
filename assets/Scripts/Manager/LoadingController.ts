import { _decorator, Component, ProgressBar, Label, Node, director } from 'cc';
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
    private isLoaded: boolean = false;
    private isLoggedIn: boolean = false;
    // private authService: AuthService = null;
    // private wsService: WebSocketService = null;

    start() {
        this.startButton.active = false;
        // this.authService = AuthService.getInstance();

        // // Initialize WebSocketService if not exists
        // if (!WebSocketService.getInstance()) {
        //     const wsNode = new Node('WebSocketService');
        //     wsNode.addComponent(WebSocketService);
        //     director.addPersistRootNode(wsNode); // Persist across scenes
        //     console.log('[Loading] WebSocketService component created and persisted');
        // }

        // console.log('[Loading] Starting auto login process');
        // this.performAutoLogin();

        this.loadGameplay()
    }

    loadGameplay() {
        director.preloadScene("game", (completedCount, totalCount) => {

            this.targetProgress = completedCount / totalCount;

        }, () => {

            // preload xong
            this.targetProgress = 1;
            this.isLoaded = true;

        });
    }

    update(dt: number) {
        // Fast loading - increase by 2x speed
        if (this.currentProgress < this.targetProgress) {
            this.currentProgress += dt * 2;
            if (this.currentProgress > this.targetProgress) {
                this.currentProgress = this.targetProgress;
            }
        }

        this.progressBar.progress = this.currentProgress;

        if (this.isLoaded && this.currentProgress >= 1) {
            this.progressBar.node.active = false;
            this.startButton.active = true;
        }
    }

    private getQueryParam(key: string): string | null {
        if (typeof window === 'undefined' || !window.location) {
            return null;
        }
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    }

    // async performAutoLogin() {
    //     if (this.statusLabel) {
    //         this.statusLabel.string = 'Đang đăng nhập...';
    //     }

    //     try {
    //         const tokenFromUrl = this.getQueryParam('token');
    //         const gameIdFromUrl = this.getQueryParam('gameID') || GameConfig.gameId;

    //         if (gameIdFromUrl) {
    //             GameConfig.gameId = gameIdFromUrl;
    //         }

    //         const loginResult = tokenFromUrl
    //             ? await this.authService.loginWithUrlToken(tokenFromUrl)
    //             : await this.authService.autoLogin();

    //         if (loginResult.success && loginResult.token) {
    //             if (this.statusLabel) {
    //                 this.statusLabel.string = 'Đang kết nối...';
    //             }

    //             // Connect to WebSocket
    //             this.wsService = WebSocketService.getInstance();
    //             if (this.wsService) {
    //                 await this.wsService.connect(GameConfig.url_ws, loginResult.token);

    //                 // Wait a bit for server to finish connection setup
    //                 await new Promise(resolve => setTimeout(resolve, 500));

    //                 // Fetch user profile
    //                 try {
    //                     const profile = await this.wsService.getProfile();
    //                     UserInfo.getInstance().updateProfile(profile);
    //                 } catch (error) {
    //                     console.warn('[Loading] Failed to load profile:', error);
    //                 }
    //             }

    //             this.isLoggedIn = true;
    //             if (this.statusLabel) {
    //                 this.statusLabel.string = 'Sẵn sàng!';
    //             }

    //             // Set progress to 100% immediately
    //             this.targetProgress = 1;
    //             this.currentProgress = 1;
    //             this.isLoaded = true;
    //         } else {
    //             console.error('[Loading] Login failed:', loginResult.error);
    //             if (this.statusLabel) {
    //                 this.statusLabel.string = 'Đăng nhập thất bại: ' + (loginResult.error || 'Unknown error');
    //             }
    //         }
    //     } catch (error) {
    //         console.error('[Loading] Login error:', error);
    //         if (this.statusLabel) {
    //             this.statusLabel.string = 'Lỗi đăng nhập: ' + error.message;
    //         }
    //     }
    // }

    onClickStart() {
        director.loadScene("Gameplay");
        if (this.isLoggedIn && this.isLoaded) {

        }
    }
}
