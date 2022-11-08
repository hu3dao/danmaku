import Danmu from "./danmu";
import Track from "./track";
import { IOptions } from "./types";
import { getEl, isEmptyArray } from "./utils";
import "intersection-observer";

const TIME_PER_FRAME = 16.6;
const scaleRatio =
  750 /
  (window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth);

export default class danmaku<T> {
  private readonly defaultOptions: IOptions<T> = {
    maxTrack: 3,
    maxPool: 10,
    duration: 6000,
    autoPlay: true,
    loop: false,
    style: {
      fontSize: "20px",
      color: "#000",
    },
    render: (arg) => {
      let text = "这是一条弹幕";
      if (arg && arg.text) {
        text = arg.text;
      }
      const dom = document.createElement("div");
      for (const key in this.options.style) {
        if (this.options.style[key]) {
          dom.style[key] = this.options.style[key] as string;
        }
      }
      dom.innerHTML = text;
      return dom;
    },
  };

  readonly el: HTMLElement;
  options: IOptions<T>;
  waitingQueue: Array<T> = [];
  tracks: Track<T>[] = [];
  elWidth: number = 0;
  elHeight: number = 0;
  domPool: HTMLElement[] = [];
  animation: number | null = null;
  initElFlag: boolean = true;
  initTracksFlag: boolean = true;
  isVisible: boolean = false;

  constructor(el: HTMLElement | string, options?: Partial<IOptions<T>>) {
    this.el = getEl(el);
    this.observer();
    this.options = Object.assign({}, this.defaultOptions, options);
    const { danmus = [] } = this.options;
    this.waitingQueue = Object.assign([], danmus);
    this.initDomPool();
  }
  private observer() {
    const observer = new IntersectionObserver((res) => {
      if (res[0].intersectionRatio <= 0) {
        this.isVisible = false;
        this.stop();
      } else {
        this.isVisible = true;
        if (this.initTracksFlag && this.waitingQueue[0]) {
          this.initTracks();
        }
        if (this.initElFlag) {
          this.elWidth = this.el.offsetWidth;
          this.elHeight = this.el.offsetHeight;
          this.initElFlag = false;
          this.options.autoPlay && this.start();
        } else {
          this.start();
        }
      }
    }, {});
    observer.observe(this.el);
  }
  private get _defaultSpeed(): number {
    return (this.elWidth / this.options.duration) * TIME_PER_FRAME;
  }
  private get _speedCoefficient(): number {
    return 0.8 + Math.random() * 1.3;
  }
  initDomPool() {
    for (let i = 0; i < this.options.maxPool; i++) {
      const dom = document.createElement("div");
      dom.style.position = "absolute";
      dom.style.transform = `translate(${this.elWidth}px)`;
      this.el.appendChild(dom);
      this.domPool.push(dom);
    }
  }
  initTracks() {
    const dom = document.createElement("div");
    dom.style.opacity = "0";
    this.el.appendChild(dom);
    const { render } = this.options;
    dom.appendChild(render.call(this, this.waitingQueue[0]));
    const height = dom.offsetHeight;
    this.el.removeChild(dom);
    for (let i = 0; i < this.options.maxTrack; i++) {
      this.tracks.push(new Track(height * i));
    }
    this.initTracksFlag = false;
  }
  emit(data: T[] | T) {
    if (data instanceof Array) {
      this.waitingQueue.push(...data);
    } else {
      this.waitingQueue.push(data);
    }
    if (this.initTracksFlag && this.waitingQueue[0] && this.isVisible) {
      this.initTracks();
    }
  }
  start() {
    if (this.animation) {
      return;
    }
    this._render();
  }
  // 暂停
  stop() {
    if (!this.animation) {
      return;
    }
    cancelAnimationFrame(this.animation);
    this.animation = null;
  }
  // 清除
  clear() {
    this.tracks.forEach((track) => {
      track.danmus.forEach((danmu) => {
        this.el.removeChild(danmu.dom);
      });
      track.reset();
    });
    this.stop();
  }
  // 核心方法，负责轨道的渲染
  _render() {
    this._extractDanmu();
    this.tracks.forEach((track) => {
      let isRemove = false;
      let removeIndex = -1;
      track.danmus.forEach((danmu, danmuIndex) => {
        const { dom, offset, danmuObject } = danmu;
        dom.style.transform = `translate(${offset}px, ${track.top}px)`;
        danmu.offset -= danmu.speed;
        if (danmu.offset < 0 && Math.abs(danmu.offset) > danmu.width + 5) {
          isRemove = true;
          removeIndex = danmuIndex;
          dom.innerHTML = "";
          this.domPool.push(dom);
          if (this.options.loop) {
            this.emit(danmuObject);
          }
        }
      });
      track.updateOffset();
      if (isRemove) {
        track.removeOfIndex(removeIndex);
      }
    });

    this.animation = requestAnimationFrame(this._render.bind(this));
  }
  // 将等待队列中的弹幕推送到合适的轨道
  _extractDanmu(): void {
    let isEntered: boolean;
    for (let i = 0; i < this.waitingQueue.length; ) {
      isEntered = this._pushToTrack(this.waitingQueue[i]);
      if (!isEntered) {
        break;
      }
      this.waitingQueue.shift();
    }
  }
  _pushToTrack(danmuObject: T): boolean {
    const trackId = this._findTrack();
    if (trackId === -1) {
      return false;
    }
    if (!this.domPool.length) {
      return false;
    }

    const dom = this.domPool.pop();
    if (!dom) {
      return false;
    }
    // 创建弹幕的实例
    dom.appendChild(this.options.render.call(this, danmuObject));
    const danmu = new Danmu<T>(dom, this.elWidth, danmuObject);
    const width = (danmu.width = danmu.dom.offsetWidth * scaleRatio);
    // 计算弹幕的速度
    const track = this.tracks[trackId];
    const trackOffset = track.offset;
    const trackWidth = this.elWidth;
    let speed: number;
    if (isEmptyArray(track.danmus)) {
      speed = this._defaultSpeed * this._speedCoefficient;
    } else {
      const { speed: preSpeed } = track.danmus[track.danmus.length - 1];
      speed = (trackWidth * preSpeed) / trackOffset;
    }
    speed = Math.min(Math.abs(speed), this._defaultSpeed * 2);
    danmu.speed = speed;
    // 将弹幕实例推送到轨道
    track.danmus.push(danmu);
    track.offset = trackWidth + width * 0.6 + Math.random() * 12;
    return true;
  }
  // 查找合适推送弹幕的轨道
  _findTrack(): number {
    let id = -1;
    let max = -Infinity; // 最大剩余空间
    this.tracks.forEach((track, index) => {
      const trackOffset = track.offset;
      if (trackOffset > this.elWidth) {
        return;
      }
      // 存在多个合适的轨道时，使用剩余空间最大的
      const t = this.elWidth - trackOffset;
      if (t > max) {
        id = index;
        max = t;
      }
    });
    return id;
  }
}
