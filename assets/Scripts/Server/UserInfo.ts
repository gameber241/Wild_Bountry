import { director } from "cc";

export class UserInfo {
    private static instance: UserInfo = null;

    public userId: number = 0;
    public username: string = '';
    public balance: number = 0;
    public freeSpins: number = 0;
    public partnerId: number = 0;

    public static getInstance(): UserInfo {
        if (!UserInfo.instance) {
            UserInfo.instance = new UserInfo();
        }
        return UserInfo.instance;
    }

    public updateProfile(data: any): void {
        const profileData = data?.data || data;
        const user = profileData?.user || profileData;
        const wallets = Array.isArray(profileData?.wallets) ? profileData.wallets : [];
        const primaryWallet = wallets[0] || null;

        if (user?.id !== undefined || user?.userId !== undefined) {
            this.userId = Number(user.id ?? user.userId);
        }
        if (user?.username) this.username = user.username;
        if (primaryWallet?.balance !== undefined) {
            this.balance = Number(primaryWallet.balance);
        } else if (user?.balance !== undefined) {
            this.balance = Number(user.balance);
        } else if (profileData?.balance !== undefined) {
            this.balance = Number(profileData.balance);
        }
        if (primaryWallet?.free_spins !== undefined) {
            this.freeSpins = Number(primaryWallet.free_spins);
        } else if (profileData?.freeSpins !== undefined) {
            this.freeSpins = Number(profileData.freeSpins);
        } else if (profileData?.free_spins !== undefined) {
            this.freeSpins = Number(profileData.free_spins);
        }
        if (user?.partner_id !== undefined || user?.partnerId !== undefined) {
            this.partnerId = Number(user.partner_id ?? user.partnerId);
        }

        director.emit("UPDATE_BALLANCE", this.balance.toFixed(2));
    }

    public updateBalance(newBalance: number): void {
        this.balance = newBalance;
        // console.log('[UserInfo] Balance updated:', this.balance);
        director.emit("UPDATE_BALLANCE", newBalance)

    }

    public reset(): void {
        this.userId = 0;
        this.username = '';
        this.balance = 0;
        this.freeSpins = 0;
        this.partnerId = 0;
    }
}
