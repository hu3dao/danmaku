# 如何“优雅”的实现弹幕功能
## 前言
如今大多视频网站都有弹幕功能，相较于以前的留言板，弹幕具有更好的交互性和实时性，也更符合用户的观看习惯
## 弹幕的实现方式
目前市面上弹幕的实现方式有两种：一个是HTML+CSS的方式，一种是Canvas方式

HTML+CSS的实现方式的优点是可以方便的给每条弹幕添加事件，例如点击弹幕显示工具菜单（点赞，举报等）；缺点是性能没有Canvas实现好，前者会创建非常多的DOM节点，当弹幕过多出现大量DOM节点时可能会出现卡顿、卡死的情况

Canvas实现的的优点如上所述性能好，缺点是给弹幕加上事件比较困难，需要自己去写一套事件系统

本次代码是采用HTML+CSS的方式实现的，实现主要的滚动弹幕
## 需求分析
实现不重叠、不碰撞的弹幕

弹幕样式支持自定义
![七夕活动表白墙](./public/%E4%B8%83%E5%A4%95%E6%B4%BB%E5%8A%A8%E8%A1%A8%E7%99%BD%E5%A2%99.png)

目前弹幕的形式分为：滚动弹幕、顶部固定弹幕和底部固定弹幕，在此基础上衍生出高级弹幕（图片、彩色等）例如：彩色滚动弹幕、彩色固定弹幕、图片滚动弹幕、图片固定弹幕
![滚动弹幕](./public/%E6%BB%9A%E5%8A%A8%E5%BC%B9%E5%B9%95.png)
![顶部固定弹幕](./public/%E9%A1%B6%E9%83%A8%E5%9B%BA%E5%AE%9A%E5%BC%B9%E5%B9%95.png)
![底部固定弹幕](./public/%E5%BA%95%E9%83%A8%E5%9B%BA%E5%AE%9A%E5%BC%B9%E5%B9%95.png)
![彩色滚动弹幕](./public/%E5%BD%A9%E8%89%B2%E6%BB%9A%E5%8A%A8%E5%BC%B9%E5%B9%95.png)

根据上面的图片分析，弹幕被分成了一行一行的，我们可以称之为轨道，只要我们将弹幕分成若干个轨道，再在合适的时机把弹幕推送到轨道并设置弹幕的速度进行平移就可以实现不重叠、不碰撞的弹幕了

要实现弹幕样式自定义，可以采用调用者传入弹幕组件，代码内部将组件生成挂载到弹幕容器再推送到弹幕展示区域，重点是vue提供的h和render函数

## 代码实现
一个弹幕页面需要包含指挥官、轨道、dom池、弹幕这四个模块

指挥官：负责将弹幕放到等待队列，寻找合适的轨道，从dom池取出一个弹幕承载容器并挂载，将弹幕推送到指定的轨道，最后进行渲染

轨道：维护已经在轨道的弹幕列表，计算轨道已经被弹幕被占据的宽度

dom池：避免频繁的dom重建，将已经消失在屏幕的dom回收，有新弹幕时重复利用

弹幕：复制将外部传的组件进行渲染并挂载到dom容器中，设置弹幕的样式
### 指挥官
新建danmaku.ts文件,实现指挥官类

指挥官类有以下的属性
```ts
el: HTMLElement // 弹幕显示的区域
waitingQueue: IDanmuObject<T>[] = [] // 弹幕等待队列
tracks: Track<T>[] = [] // 轨道数组
maxTrack: number = 4 // 最大轨道数
domPool: IDanmuContainer[] = [] // dom池
maxPool: number = 30 // dom池最大dom数
danmuComp: any // 弹幕组件
duration: number = 10000 // 弹幕展示的时长
trackWidth: number // 轨道的宽度
trackHeight: number = 20 // 轨道的高度
animation: number | null = null 
elmToObj: WeakMap<HTMLElement, Danmu<T>> = new WeakMap()
```
核心方法_render，主要作用是：1.从等待队列中抽取合适弹幕推送到轨道；2.遍历每条轨道中的弹幕数组，依次渲染
```ts
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
```
_extractDanmu方法的作用是从等待队列中推送轨道
```ts
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
```
_extractBarrage方法遍历等待队列，依次按顺序执行_pushToTrack方法。当返回True时，则说明该弹幕成功加入到合适的轨道中，否则说明目前没有合适的轨道则结束推送

_pushToTrack方法的作用是：1.推送弹幕到轨道；2.创建弹幕实例；3.计算弹幕的速度
```ts
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
```
_findTrack方法用于寻找合适的轨道，从上往下寻找，找到空位最多的那条轨道
```ts
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
```
计算弹幕的速度属于初中的追及问题，弹幕A以x的速度匀速前进，当弹幕距离终点的距离为T时，弹幕B从起点出发，以y匀速前进，想要AB弹幕同时到达终点，计算弹幕B的速度，同时考虑到如果弹幕B距离弹幕A过远，速度回很快，导致弹幕内容还没看到就一闪而过了，所以我们限制最大速度为默认速度的两倍
```ts
// 默认速度，返回的是每帧前进的位移
// TIME_PER_FRAME为16.6即屏幕刷新的时间，一秒钟刷新60帧则一帧为16.6ms
private get _defaultSpeed(): number {
  return (this.trackWidth / this.duration) * TIME_PER_FRAME
}
// 获取一个速度系数，用于随机速度
private get _speedCoefficient(): number {
  return 0.8 + Math.random() * 1.3
}
```
```ts
// 计算弹幕的速度
  const track = this.tracks[trackId]
  const trackOffset = track.offset
  const trackWidth = this.trackWidth
  let speed: number
  if(isEmptyArray(track.danmus)) {
    speed = this._defaultSpeed * this._speedCoefficient
  } else {
    const {speed: preSpeed} = track.danmus[track.danmus.length-1]
    // 限制最大速度为默认速度的两倍
    speed = (trackWidth * preSpeed) / trackOffset
  }
  // 
  speed = Math.min(speed, this._defaultSpeed * 2)
  danmu.speed = speed
```
循环轨道中的弹幕数组并渲染，考虑到每一帧后弹幕的偏移量都会减少，因此还需要执行danmu.offset -= danmu.speed这一句进行偏移量更新。判断弹幕是否已经位移到不可见的位置，是的话就从轨道弹出并将承载的dom进行回收
```ts
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
```
![轨道弹幕](./public/%E8%BD%A8%E9%81%93%E5%BC%B9%E5%B9%95.jpg)
完整代码
```ts
// danmaku.ts

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
  maxTrack: number = 4
  domPool: IDanmuContainer[] = []
  maxPool: number = 30
  danmuComp: any
  duration: number = 10000 // 弹幕展示的时长
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
      const path: HTMLElement[] = e.path
      const parent = path[1]
      this.clearStopStatus()
      const obj = this.elmToObj.get(parent)
      if(parent.id === 'danmu-container') {
        obj!.stop = true
        this.el.style.pointerEvents = 'auto'
        const rect = parent.getBoundingClientRect()
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
```

### 轨道
新建track.ts文件，实现轨道类，每一个轨道有两个属性，danmus为一个弹幕实例数组，offset则是已占据的宽度。offset用于滚动弹幕时，弹幕轨道添加弹幕前判断最佳轨道
```ts
danmus: Danmu<T>[] = []
offset: number = 0 // 轨道已经被占据的宽度
```
添加弹幕，将新的弹幕实例push到数组
```ts
push(item: Danmu<T>) {
  this.danmus.push(item)
}
```
删除弹幕，将头部的弹幕实例弹出
```ts
remove() {
  this.danmus.shift()
}
```
删除特定位置的弹幕，将特定位置的弹幕实例弹出
```ts
removeOfIndex(index: number) {
  if(index < 0 || index >= this.danmus.length) {
    return
  }
  return this.danmus.splice(index, 1)[0]
}
```
重置轨道，拖动时间线或视频结束，清空弹幕实例，并重置offset
```ts
reset() {
  this.danmus = []
  this.offset = 0
}
```
更新轨道剩已经占据的位置，我们实际需要的是剩余空间则通过剩余空间 = 轨道宽度 - offset来计算
```ts
updateOffset() {
  const lastDanmu = this.danmus[this.danmus.length - 1]
  if(lastDanmu) {
    const {speed} = lastDanmu
    this.offset -= speed
  }
}
```
完整代码
```ts
// track.ts

import Danmu from "./danmu"

class Track<T> {
  danmus: Danmu<T>[] = []
  offset: number = 0 // 轨道已经被占据的宽度

  push(item: Danmu<T>) {
    this.danmus.push(item)
  }

  remove() {
    this.danmus.shift()
  }

  removeOfIndex(index: number) {
    if(index < 0 || index >= this.danmus.length) {
      return
    }
    return this.danmus.splice(index, 1)[0]
  }

  reset() {
    this.danmus = []
    this.offset = 0
  }

  updateOffset() {
    const lastDanmu = this.danmus[this.danmus.length - 1]
    if(lastDanmu) {
      const {speed} = lastDanmu
      this.offset -= speed
    }
  }
}

export default Track
```

### 弹幕
属性
```ts
danmuContainer: IDanmuContainer // 承载弹幕的容器
dom: HTMLElement // 生成的弹幕dom
offset: number = 0 // 左侧的距离
speed: number = 0 // 速度
width: number = 0 // 宽度
stop: boolean = false // 是否暂停
```
通过vue的render和h函数创建弹幕并挂载到d容器上
```ts
create(danmuComp: any, danmuProps: T) {
  const {dom} = this.danmuContainer
  render(h(danmuComp, danmuProps), dom)
  this.dom = dom
  this.dom.id = 'danmu-container'
}
```
初始化dom的样式
```ts
initStyle() {
  this.dom.style.position = 'absolute'
  this.dom.style.transform = `translate(${this.offset}px)`
  this.dom.style.pointerEvents = 'auto'
}
```
完整代码
```ts
import {h, render} from "vue"
import EventEmitter from "./event-emitter"
import { IDanmuContainer } from "./types"
class Danmu<T> extends EventEmitter {
  danmuContainer: IDanmuContainer // 承载弹幕的容器
  dom: HTMLElement // 生成的弹幕dom
  offset: number = 0
  speed: number = 0
  width: number = 0
  stop: boolean = false

  constructor(danmuContainer: IDanmuContainer, danmuComp: any, danmuProps: T, left: number) {
    super()
    this.danmuContainer = danmuContainer
    this.offset = left
    this.create(danmuComp, danmuProps)
    this.initStyle()
    
  }
  initStyle() {
    this.dom.style.position = 'absolute'
    this.dom.style.transform = `translate(${this.offset}px)`
    this.dom.style.pointerEvents = 'auto'
  }
  create(danmuComp: any, danmuProps: T) {
    const {dom} = this.danmuContainer
    render(h(danmuComp, danmuProps), dom)
    this.dom = dom
    this.dom.id = 'danmu-container'
  }
}

export default Danmu
```
## 总结
本文使用vue进行弹幕的实现，如果使用其他的框架则只需要修改弹幕类里的create方法，通过传入弹幕组件，代码内部实现创建弹幕dom并挂载的方式可以极大的提高弹幕的自定义

代码已上传github，[danmaku的github地址](https://github.com/hu3dao/danmaku)