import { _decorator, AudioClip, AudioSource, Component, Node } from 'cc';
import { BigWin } from './BigWin';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    public static instance: AudioManager

    @property(AudioSource)
    bgMusic: AudioSource = null

    @property(AudioSource)
    Sound: AudioSource = null

    @property(AudioSource)
    SoundWin: AudioSource = null

    @property(AudioClip)
    bgNormal: AudioClip = null

    @property(AudioClip)
    bgFree: AudioClip = null

    @property(AudioClip)
    btnSpin: AudioClip = null



    @property(AudioClip)
    reelStart: AudioClip = null

    @property(AudioClip)
    reelEnd: AudioClip = null

    @property(AudioClip)
    reelSlow: AudioClip = null

    @property(AudioClip)
    intro: AudioClip = null
    @property(AudioClip)
    click: AudioClip = null
    @property(AudioClip)
    win: AudioClip = null

    @property(AudioClip)
    winBar1: AudioClip = null

    @property(AudioClip)
    winBar2: AudioClip = null

    @property(AudioClip)
    winBar3: AudioClip = null

    @property(AudioClip)
    winBarhit: AudioClip = null

    @property(AudioClip)
    multiMove: AudioClip = null


    @property(AudioClip)
    BigWin: AudioClip = null


    @property(AudioClip)
    totalWIn: AudioClip = null



    @property(AudioClip)
    SuperWin: AudioClip = null


    @property(AudioClip)
    score: AudioClip = null

    @property(AudioClip)
    megawin: AudioClip = null
    protected onLoad(): void {
        AudioManager.instance = this
        this.Intro()
    }

    isSound = true
    isNormal = false
    PlaybgNormal() {
        if (this.isSound == false) {
            this.bgMusic.volume = 0
            return

        }
        if (this.isNormal == true) return
        this.isNormal = true
        this.bgMusic.volume = 1
        this.bgMusic.clip = this.bgNormal
        this.bgMusic.loop = true
        this.bgMusic.play()

    }

    PlaybgFree() {
        if (this.isSound == false) {
            this.bgMusic.volume = 0
            return
        }
        if (this.isNormal == false) return
        this.isNormal = false
        this.bgMusic.volume = 1
        this.bgMusic.clip = this.bgFree
        this.bgMusic.loop = true
        this.bgMusic.play()
    }

    PlayBigwin() {
        if (this.isSound == false) {
            this.SoundWin.volume = 0
            return
        }
        this.SoundWin.volume = 1
        this.SoundWin.clip = this.BigWin
        this.SoundWin.loop = false
        this.SoundWin.play()

    }

    PlaySupperwin() {
        if (this.isSound == false) {
            this.SoundWin.volume = 0
            return
        }
        this.SoundWin.volume = 1
        this.SoundWin.clip = this.SuperWin
        this.SoundWin.loop = false
        this.SoundWin.play()

    }
    PlayMegaWin() {
        if (this.isSound == false) {
            this.SoundWin.volume = 0
            return
        }
        this.SoundWin.volume = 1
        this.SoundWin.clip = this.megawin
        this.SoundWin.loop = false
        this.SoundWin.play()

    }

    PlayTotalWIn() {
        if (this.isSound == false) {
            this.SoundWin.volume = 0
            return
        }
        this.SoundWin.volume = 1
        this.SoundWin.clip = this.SuperWin
        this.SoundWin.loop = false
        this.SoundWin.play()

    }


    PlayScore() {
        if (this.isSound == false) {
            this.SoundWin.volume = 0
            return
        }
        this.SoundWin.volume = 1
        this.SoundWin.playOneShot(this.score)

    }
    Intro() {
        this.PlaySound(this.intro)

    }
    CLICK() {
        this.PlaySound(this.click)

    }
    BtnSpin() {
        this.PlaySound(this.btnSpin)
    }

    ReelStart() {
        this.PlaySound(this.reelStart)
    }
    ReelEnd() {
        this.PlaySound(this.reelEnd)
    }

    ReelSLow() {
        this.PlaySound(this.reelSlow)
    }

    Win() {
        this.PlaySound(this.win)
    }
    MultiMove() {
        this.PlaySound(this.multiMove)
    }
    WinBatHit() {
        this.PlaySound(this.winBarhit)
    }
    WinBat1() {
        this.PlaySound(this.winBar1)
    }
    WinBat2() {
        this.PlaySound(this.winBar2)
    }
    WinBat3() {
        this.PlaySound(this.winBar3)
    }
    PlaySound(clip) {
        if (this.isSound == false) {
            this.Sound.volume = 0
            return
        }
        this.Sound.volume = 1
        this.Sound.playOneShot(clip)
    }

    UpdateSound(isSound) {
        this.isSound = isSound
        if (isSound == true) {
            this.Sound.volume = 1
            this.bgMusic.volume = 1
            this.SoundWin.volume = 1

        }
        else {
            this.Sound.volume = 0
            this.bgMusic.volume = 0
            this.SoundWin.volume = 0

        }
    }
}

