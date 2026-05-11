import { GameConfig } from './GameConfig';

type PendingRequest = {
    resolve: (value: any) => void;
    reject: (reason?: unknown) => void;
};

class NetworkServiceImpl {
    private token: string | null = null;
    private ws: WebSocket | null = null;
    private connecting: Promise<WebSocket> | null = null;
    private activeProfileRequest: PendingRequest | null = null;
    private profileTimeout: ReturnType<typeof setTimeout> | null = null;
    private activeSpinRequest: PendingRequest | null = null;
    private spinTimeout: ReturnType<typeof setTimeout> | null = null;

    hasToken(): boolean {
        return !!this.token;
    }

    isConnected(): boolean {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    async setToken(token: string): Promise<void> {
        this.token = token;
        this.clearProfileState();
        this.clearSpinState();

        if (this.ws) {
            try {
                this.ws.close();
            } catch (error) {
                console.warn('[NetworkService] Close socket error:', error);
            }
            this.ws = null;
        }

        this.connecting = null;
        await this.ensureConnected();
    }

    ensureConnected(): Promise<WebSocket> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve(this.ws);
        }

        if (!this.token) {
            return Promise.reject(new Error('Chưa có session token để kết nối server'));
        }

        if (this.connecting) {
            return this.connecting;
        }

        this.connecting = new Promise((resolve, reject) => {
            const url = `${GameConfig.url_ws}?gameID=${encodeURIComponent(GameConfig.gameId)}&token=${encodeURIComponent(this.token!)}`;
            const ws = new WebSocket(url);
            let settled = false;

            ws.onopen = () => {
                settled = true;
                this.ws = ws;
                this.connecting = null;
                ws.onmessage = this.handleSocketMessage.bind(this);
                ws.onclose = this.handleSocketClose.bind(this);
                resolve(ws);
            };

            ws.onerror = (event) => {
                console.error('[NetworkService] Socket error:', event);
                if (!settled) {
                    this.connecting = null;
                    reject(new Error('Không thể kết nối WebSocket'));
                }
            };

            ws.onclose = (event) => {
                if (!settled) {
                    this.connecting = null;
                    reject(new Error(event.reason || 'WebSocket đã đóng'));
                    return;
                }
                this.handleSocketClose(event);
            };
        });

        return this.connecting;
    }

    async getProfile(): Promise<any> {
        await this.ensureConnected();

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket chưa sẵn sàng'));
                return;
            }

            if (this.activeProfileRequest) {
                reject(new Error('Đang lấy thông tin người chơi'));
                return;
            }

            this.activeProfileRequest = { resolve, reject };
            this.profileTimeout = setTimeout(() => {
                if (!this.activeProfileRequest) {
                    return;
                }
                const pending = this.activeProfileRequest;
                this.clearProfileState();
                pending.reject(new Error('getProfile timeout'));
            }, 7000);

            this.ws.send(JSON.stringify({
                type: 'getProfile',
                payload: {
                    gameID: GameConfig.gameId,
                },
            }));
        });
    }

    async spin(options: { bet: number; betSize: number; betLevel: number }): Promise<any> {
        await this.ensureConnected();

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket chưa sẵn sàng'));
                return;
            }

            if (this.activeSpinRequest) {
                reject(new Error('Đang xử lý lượt quay trước'));
                return;
            }

            this.activeSpinRequest = { resolve, reject };
            this.spinTimeout = setTimeout(() => {
                if (!this.activeSpinRequest) {
                    return;
                }
                const pending = this.activeSpinRequest;
                this.clearSpinState();
                pending.reject(new Error('spin timeout'));
            }, 15000);

            this.ws.send(JSON.stringify({
                type: 'spin',
                payload: {
                    bet: options.bet,
                    betSize: options.betSize,
                    betLevel: options.betLevel,
                    gameID: GameConfig.gameId,
                    clientSentAt: Date.now(),
                },
            }));
        });
    }

    private handleSocketMessage(event: MessageEvent): void {
        let data: any;

        try {
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (error) {
            console.error('[NetworkService] Invalid message:', error);
            return;
        }

        if (data.type === 'getProfileResult' && this.activeProfileRequest) {
            const pending = this.activeProfileRequest;
            this.clearProfileState();
            pending.resolve(data.payload || data);
            return;
        }

        if (data.type === 'spinResult' && this.activeSpinRequest) {
            const pending = this.activeSpinRequest;
            this.clearSpinState();
            const payload = data.payload || data;
            if (payload?.success === false) {
                pending.reject(new Error(payload.error || 'Spin thất bại'));
                return;
            }
            pending.resolve(payload);
            return;
        }

        if (data.type === 'error') {
            const message = data.error || data.message || 'Server error';

            if (this.activeProfileRequest) {
                const pendingProfile = this.activeProfileRequest;
                this.clearProfileState();
                pendingProfile.reject(new Error(message));
            }

            if (this.activeSpinRequest) {
                const pendingSpin = this.activeSpinRequest;
                this.clearSpinState();
                pendingSpin.reject(new Error(message));
            }
        }
    }

    private handleSocketClose(): void {
        this.ws = null;
        this.connecting = null;

        if (this.activeProfileRequest) {
            const pendingProfile = this.activeProfileRequest;
            this.clearProfileState();
            pendingProfile.reject(new Error('Kết nối máy chủ bị đóng'));
        }

        if (this.activeSpinRequest) {
            const pendingSpin = this.activeSpinRequest;
            this.clearSpinState();
            pendingSpin.reject(new Error('Kết nối máy chủ bị đóng'));
        }
    }

    private clearProfileState(): void {
        if (this.profileTimeout) {
            clearTimeout(this.profileTimeout);
            this.profileTimeout = null;
        }
        this.activeProfileRequest = null;
    }

    private clearSpinState(): void {
        if (this.spinTimeout) {
            clearTimeout(this.spinTimeout);
            this.spinTimeout = null;
        }
        this.activeSpinRequest = null;
    }
}

export class NetworkService {
    private static instance: NetworkServiceImpl | null = null;

    static getInstance(): NetworkServiceImpl {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkServiceImpl();
        }

        return NetworkService.instance;
    }
}
