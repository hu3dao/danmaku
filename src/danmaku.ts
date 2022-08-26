import Track from "./track";
import { getEl, isArray, isEmptyArray, isObject } from "./utils";
import { IDanmakuOptions, IDanmuContainer, IDanmuEventHandler, IDanmuObject } from "./types";
import { TIME_PER_FRAME } from "./constants";
import Danmu from "./danmu";
import EventEmitter from "./event-emitter";

class Danmaku<T> extends EventEmitter {
  el: HTMLElement
  waitingQueue: IDanmuObject<T>[] = []
  tracks: Track<T>[] = []
  maxTrack: number = 10
  domPool: IDanmuContainer[] = []
  maxPool: number = 30
  danmuComp: any
  duration: number = 5000 // 弹幕展示的时长
  trackWidth: number // 轨道的宽度
  trackHeight: number = 20 // 轨道的高度
  animation: number | null = null
  elmToObj: WeakMap<HTMLElement, Danmu<T>> = new WeakMap()

  constructor(el: HTMLElement | string, danmuComp: any, options?: Partial<IDanmakuOptions>) {
    super()
    this.el = getEl(el)
    this.trackWidth = this.el.offsetWidth       
    this.danmuComp = danmuComp
    if(isObject(options)) {
      options?.duration && (this.duration = options.duration)
      options?.maxTrack && (this.maxTrack = options.maxTrack)
      options?.maxPool && (this.maxPool = options.maxPool)
      options?.trackHeight && (this.trackHeight = options.trackHeight)
    }
    this.initTracks()
    this.initDomPool()
    this.bindEvent()
  }

  private get _defaultSpeed(): number {
    // return this.trackWidth / (this.duration / TIME_PER_FRAME)
    return (this.trackWidth / this.duration) * TIME_PER_FRAME
  }
  // 获取一个速度系数，用于随机速度
  private get _speedCoefficient(): number {
    return 0.8 + Math.random() * 1.3
  }
  bindEvent() {
    this.el.addEventListener('click', (e: MouseEvent) => {
      this.clearStopStatus()
      console.log(e.target);
                  
      const target: HTMLElement = e.target as HTMLElement

      const obj = this.elmToObj.get(target)
      
      
      if(target.id === 'danmu-container') {
        obj!.stop = true
        this.el.style.pointerEvents = 'auto'
        const rect = target.getBoundingClientRect()
        const position = {
          top: rect.top + rect.height,
          left: e.layerX
        }
        this.$emit('onChoose', position)
      } else {
        this.$emit('onUnchoose')
      }
    })
  }
  clearStopStatus() {
    this.el.style.pointerEvents = 'none'
    this.tracks.forEach(track => {
      track.danmus.forEach(danmu => {
        danmu.stop = false
      })
    })
  }
  // 添加弹幕到等待队列中
  add(data: T[]) {
    if(isArray(data)) {      
      data.forEach(item => {
        const danmuObject: IDanmuObject<T> = {
          danmuProps: item,
          speed: 0,
          offset: this.trackWidth,
          width: 0
        }
        this.waitingQueue.push(danmuObject)
      })
    }    
  }
  // 初始化dom池
  initDomPool() {    
    for(let i = 0; i < this.maxPool; i++) {
      const dom = document.createElement("div")
      dom.style.display = "inline-block"
      const danmuContainer: IDanmuContainer = {
        dom,
        isMount: false,
      }
      this.domPool.push(danmuContainer)
    }
  }
  // 初始化轨道实例
  initTracks() {
    for(let i = 0; i < this.maxTrack; i++) {
      this.tracks.push(new Track())
    }
  }
  // 开始
  start() {
    this.el.style.opacity = '1'
    if(this.animation) {
      return
    }
    this._render()
  }
  // 暂停
  stop() {
    if(!this.animation) {
      return
    }
    cancelAnimationFrame(this.animation)
    this.animation = null
  }
  // 清除
  clear() {
    this.tracks.forEach(track => {
      track.danmus.forEach(danmu => {
        this.el.removeChild(danmu.dom)
      })
      track.reset()
    })
    this.stop()
  }
  // 核心方法，负责轨道的渲染
  _render() {
    this._extractDanmu()
    this.tracks.forEach((track, trackIndex) => {
      let isRemove = false
      let removeIndex = -1
      track.danmus.forEach((danmu, danmuIndex) => {
        if(danmu.stop) {
          return
        }
        const {dom, offset} = danmu
        dom.style.transform = `translate(${offset}px, ${trackIndex * this.trackHeight}px)`
        danmu.offset -= danmu.speed
        if(danmu.offset < 0 && Math.abs(danmu.offset) > danmu.width+5) {
          isRemove = true
          removeIndex = danmuIndex
          const {danmuContainer, dom} = danmu
          this.domPool.push(danmuContainer)
          this.elmToObj.delete(dom)
        }
      })
      track.updateOffset()
      if(isRemove) {
        track.removeOfIndex(removeIndex)
      }
    })
    
    this.animation = requestAnimationFrame(this._render.bind(this))
  }
  // 将等待队列中的弹幕推送到合适的轨道
  _extractDanmu():void {
    let isEntered: boolean
    for(let i = 0; i < this.waitingQueue.length;) {
      isEntered = this._pushToTrack(this.waitingQueue[i])
      if(!isEntered) {
        break
      }
      this.waitingQueue.shift()
    }
  }
  _pushToTrack(danmuObject: IDanmuObject<T>): boolean {
    const trackId = this._findTrack()
    if(trackId === -1) {
      return false
    }
    if(!this.domPool.length) {
      return false
    }
    const danmuContainer = this.domPool.pop() as IDanmuContainer
    // 创建弹幕的实例
    const {offset, danmuProps} = danmuObject
    const danmu = new Danmu(danmuContainer, this.danmuComp, danmuProps, offset)
    if(!danmuContainer!.isMount) {
      this.el.appendChild(danmu.dom)
      danmuContainer!.isMount = true
    }
    const width = danmu.width = danmu.dom.offsetWidth
    this.elmToObj.set(danmu.dom, danmu)
    // 计算弹幕的速度
    const track = this.tracks[trackId]
    const trackOffset = track.offset
    const trackWidth = this.trackWidth
    let speed: number
    if(isEmptyArray(track.danmus)) {
      speed = this._defaultSpeed * this._speedCoefficient
    } else {
      const {speed: preSpeed} = track.danmus[track.danmus.length-1]
      speed = (trackWidth * preSpeed) / trackOffset
    }
    speed = Math.min(speed, this._defaultSpeed * 2)
    danmu.speed = speed
    // 将弹幕实例推送到轨道
    track.danmus.push(danmu)
    track.offset = trackWidth + width * 1.1 + Math.random() * 50 
    return true
  }
  // 查找合适推送弹幕的轨道
  _findTrack(): number {
    let id = -1
    let max = -Infinity  // 最大剩余空间
    this.tracks.forEach((tranck, index) => {
      const trackOffset = tranck.offset
      if(trackOffset > this.trackWidth) {
        return
      }
      // 存在多个合适的轨道时，使用剩余空间最大的
      const t = this.trackWidth - trackOffset
      if(t > max) {
        id = index
        max = t
      }
    })
    return id
  }

  onChoose(handler: IDanmuEventHandler) {
    this.$on('onChoose', handler)
  }
  onUnchoose(handler: IDanmuEventHandler) {
    this.$on('onUnchoose', handler)
  }
}

export default Danmaku