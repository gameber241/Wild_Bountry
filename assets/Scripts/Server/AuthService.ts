import { GameConfig } from './GameConfig';
import { NetworkService } from './NetworkService';
import { UserInfo } from './UserInfo';

export class AuthService {
    static getQueryParam(key: string): string | null {
        if (typeof window === 'undefined' || !window.location) {
            return null;
        }

        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    }

    static async ensureAuthenticated(): Promise<void> {
        const networkService = NetworkService.getInstance();

        if (!networkService.hasToken()) {
            const sessionToken = await this.resolveSessionToken();
            await networkService.setToken(sessionToken);
        } else {
            await networkService.ensureConnected();
        }

        const profile = await networkService.getProfile();
        UserInfo.getInstance().updateProfile(profile);
    }

    private static async resolveSessionToken(): Promise<string> {
        const tokenFromUrl = this.getQueryParam('token');
        if (tokenFromUrl) {
            return this.loginWithUrlToken(tokenFromUrl);
        }

        if (GameConfig.autoLogin.enabled) {
            return this.loginWithAutoLogin();
        }

        throw new Error('Auto login is disabled and no token found in URL');
    }

    private static async loginWithUrlToken(token: string): Promise<string> {
        const response = await fetch(`${GameConfig.url_api}/api/user/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const payload = await this.readJson(response);
        if (!response.ok) {
            throw new Error(payload?.message || `HTTP ${response.status}`);
        }

        const sessionToken = payload?.data?.sessionToken;
        if (!payload?.success || !sessionToken) {
            throw new Error(payload?.message || 'Không nhận được session token');
        }

        return sessionToken;
    }

    private static async loginWithAutoLogin(): Promise<string> {
        const { apiKey, secretKey, username, password } = GameConfig.autoLogin;
        const path = '/api/user/login';
        const timestamp = Date.now().toString();
        const body = JSON.stringify({ username, password });
        const signatureBody = '{}';
        const signature = await this.createHmacSha256(`POST|${path}|${timestamp}|${signatureBody}`, secretKey);

        const response = await fetch(`${GameConfig.url_api}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'X-Timestamp': timestamp,
                'X-Signature': signature,
            },
            body,
        });

        const payload = await this.readJson(response);
        if (!response.ok) {
            throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
        }

        const sessionToken = payload?.data?.token || payload?.token;
        if (!sessionToken) {
            throw new Error(payload?.message || 'Không nhận được token đăng nhập');
        }

        return sessionToken;
    }

    private static async createHmacSha256(message: string, secret: string): Promise<string> {
        const cryptoApi = globalThis.crypto?.subtle;
        if (!cryptoApi) {
            throw new Error('Trình duyệt hiện tại không hỗ trợ Web Crypto');
        }

        const encoder = new TextEncoder();
        const key = await cryptoApi.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await cryptoApi.sign('HMAC', key, encoder.encode(message));

        return Array.from(new Uint8Array(signature))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    private static async readJson(response: Response): Promise<any> {
        const text = await response.text();
        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch {
            return { message: text };
        }
    }
}
