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
    private activeLogsRequest: PendingRequest | null = null;
    private logsTimeout: ReturnType<typeof setTimeout> | null = null;
    private activeLogDetailRequest: PendingRequest | null = null;
    private logDetailTimeout: ReturnType<typeof setTimeout> | null = null;

    // Callback để handle từng free spin trong batch
    public onBatchSpin?: (spinData: any) => void;

    hasToken(): boolean {
        return !!this.token;
    }

    setBatchSpinCallback(callback: (spinData: any) => void): void {
        this.onBatchSpin = callback;
    }

    isConnected(): boolean {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    async setToken(token: string): Promise<void> {
        this.token = token;
        this.clearProfileState();
        this.clearSpinState();
        this.clearLogsState();
        this.clearLogDetailState();
        this.onBatchSpin = undefined; // Clear callback khi đổi token

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
                this.handleSocketClose();
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

    async getLogs(options: {
        limit?: number;
        offset?: number;
        skip?: number;
        sort?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<any> {
        await this.ensureConnected();

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket chưa sẵn sàng'));
                return;
            }

            if (this.activeLogsRequest) {
                reject(new Error('Đang tải danh sách lịch sử'));
                return;
            }

            this.activeLogsRequest = { resolve, reject };
            this.logsTimeout = setTimeout(() => {
                if (!this.activeLogsRequest) {
                    return;
                }
                const pending = this.activeLogsRequest;
                this.clearLogsState();
                pending.reject(new Error('getLogs timeout'));
            }, 10000);

            this.ws.send(JSON.stringify({
                type: 'getLogs',
                payload: {
                    ...options,
                    gameID: GameConfig.gameId,
                },
            }));
        });
    }

    async getLogDetail(id: string): Promise<any> {
        await this.ensureConnected();

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket chưa sẵn sàng'));
                return;
            }

            if (this.activeLogDetailRequest) {
                reject(new Error('Đang tải chi tiết lịch sử'));
                return;
            }

            this.activeLogDetailRequest = { resolve, reject };
            this.logDetailTimeout = setTimeout(() => {
                if (!this.activeLogDetailRequest) {
                    return;
                }
                const pending = this.activeLogDetailRequest;
                this.clearLogDetailState();
                pending.reject(new Error('getLogDetail timeout'));
            }, 10000);

            this.ws.send(JSON.stringify({
                type: 'getLogDetail',
                payload: {
                    id,
                    gameID: GameConfig.gameId,
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

            // Handle batch free spins nếu có
            if (payload.batchSpins && Array.isArray(payload.batchSpins) && payload.batchSpins.length > 0) {
                console.log(`[NetworkService] Processing ${payload.batchSpins.length} batch free spins`);
                console.log("Free", payload.batchSpins)

                payload.batchSpins.forEach((batchSpin: any, index: number) => {
                    console.log(`[NetworkService] Processing batch spin ${index + 1}/${payload.batchSpins.length}`);
                    if (this.onBatchSpin) {
                        this.onBatchSpin(batchSpin);
                    } else {
                        console.warn('[NetworkService] onBatchSpin callback not set, batch spin ignored');
                    }
                });
            }

            pending.resolve(payload);
            return;
        }

        if (data.type === 'getLogsResult' && this.activeLogsRequest) {
            const pending = this.activeLogsRequest;
            this.clearLogsState();
            const payload = data.payload || data;
            if (payload?.success === false) {
                pending.reject(new Error(payload.error || 'Không thể lấy lịch sử'));
                return;
            }
            pending.resolve(payload);
            return;
        }

        if (data.type === 'getLogDetailResult' && this.activeLogDetailRequest) {
            const pending = this.activeLogDetailRequest;
            this.clearLogDetailState();
            const payload = data.payload || data;
            if (payload?.success === false) {
                pending.reject(new Error(payload.error || 'Không thể lấy chi tiết lịch sử'));
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

            if (this.activeLogsRequest) {
                const pendingLogs = this.activeLogsRequest;
                this.clearLogsState();
                pendingLogs.reject(new Error(message));
            }

            if (this.activeLogDetailRequest) {
                const pendingLogDetail = this.activeLogDetailRequest;
                this.clearLogDetailState();
                pendingLogDetail.reject(new Error(message));
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

        if (this.activeLogsRequest) {
            const pendingLogs = this.activeLogsRequest;
            this.clearLogsState();
            pendingLogs.reject(new Error('Kết nối máy chủ bị đóng'));
        }

        if (this.activeLogDetailRequest) {
            const pendingLogDetail = this.activeLogDetailRequest;
            this.clearLogDetailState();
            pendingLogDetail.reject(new Error('Kết nối máy chủ bị đóng'));
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
        // Không clear onBatchSpin ở đây vì nó có thể được set một lần
    }

    private clearLogsState(): void {
        if (this.logsTimeout) {
            clearTimeout(this.logsTimeout);
            this.logsTimeout = null;
        }
        this.activeLogsRequest = null;
    }

    private clearLogDetailState(): void {
        if (this.logDetailTimeout) {
            clearTimeout(this.logDetailTimeout);
            this.logDetailTimeout = null;
        }
        this.activeLogDetailRequest = null;
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
