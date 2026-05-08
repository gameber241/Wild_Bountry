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
        // console.log('[UserInfo] ===== UPDATE PROFILE CALLED =====');
        // console.log('[UserInfo] Received data:', JSON.stringify(data, null, 2));

        // Unwrap the data if it has success/data structure
        const profileData = data.data || data;

        // console.log('[UserInfo] profileData.userId:', profileData.userId);
        // console.log('[UserInfo] profileData.username:', profileData.username);
        // console.log('[UserInfo] profileData.balance:', profileData.balance);
        // console.log('[UserInfo] profileData.freeSpins:', profileData.freeSpins);
        // console.log('[UserInfo] profileData.partnerId:', profileData.partnerId);

        if (profileData.userId) this.userId = Number(profileData.userId);
        if (profileData.username) this.username = profileData.username;
        if (profileData.balance !== undefined) this.balance = Number(profileData.balance);
        if (profileData.freeSpins !== undefined) this.freeSpins = Number(profileData.freeSpins);
        if (profileData.partnerId) this.partnerId = Number(profileData.partnerId);

        // console.log('[UserInfo] Profile updated - Final state:', {
        //     userId: this.userId,
        //     username: this.username,
        //     balance: this.balance,
        //     freeSpins: this.freeSpins,
        //     partnerId: this.partnerId
        // });
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
