import {h, render} from "vue"
import EventEmitter from "./event-emitter"
import { IDanmuContainer } from "./types"
class Danmu<T> extends EventEmitter {
  danmuContainer: IDanmuContainer
  dom: HTMLElement
  offset: number = 0
  speed: number = 0
  width: number = 0
  stop: boolean = false

  constructor(danmuContainer: IDanmuContainer, danmuComp: any, danmuProps: T, left: number) {
    super()
    this.danmuContainer = danmuContainer
    const {dom} = danmuContainer
    render(h(danmuComp, danmuProps), dom)
    this.offset = left
    this.dom = dom
    this.dom.id = 'danmu-container'
    this.initStyle()
    
  }
  initStyle() {
    this.dom.style.position = 'absolute'
    this.dom.style.transform = `translate(${this.offset}px)`
    this.dom.style.pointerEvents = 'auto'
  }
}

export default Danmu