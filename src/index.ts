import Danmu from "./danmu";
import Track from "./track";
import { IOptions } from "./types";
import { getEl, isEmptyArray } from "./utils";

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
    trackHeight: 20,
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
  trackWidth: number = 0;
  domPool: HTMLElement[] = [];
  animation: number | null = null;
  resetOptionsFlag: boolean = true;

  constructor(el: HTMLElement | string, options?: Partial<IOptions<T>>) {
    this.el = getEl(el);
    this.trackWidth = this.el.offsetWidth;
    this.options = Object.assign({}, this.defaultOptions, options);
    const { danmus = [] } = this.options;
    this.waitingQueue = Object.assign([], danmus);
    if (this.waitingQueue[0]) {
      this.initOptions();
    }
    this.initDomPool();
  }
  private get _defaultSpeed(): number {
    return (this.trackWidth / this.options.duration) * TIME_PER_FRAME;
  }
  private get _speedCoefficient(): number {
    return 0.8 + Math.random() * 1.3;
  }
  private initOptions() {
    const { render } = this.options;
    const dom = render.call(this, this.waitingQueue[0]);
    dom.style.opacity = "0";
    this.el.appendChild(dom);
    const { height } = dom.getBoundingClientRect();
    this.options.trackHeight = Math.max(this.options.trackHeight, height);
    const maxTrack = Math.floor(
      this.el.offsetHeight / this.options.trackHeight
    );
    this.options.maxTrack =
      this.options.maxTrack > maxTrack ? maxTrack : this.options.maxTrack;
    this.el.removeChild(dom);
    this.initTracks();
    this.resetOptionsFlag = false;
  }
  initDomPool() {
    for (let i = 0; i < this.options.maxPool; i++) {
      const dom = document.createElement("div");
      dom.style.position = "absolute";
      dom.style.transform = `translate(${this.trackWidth}px)`;
      this.el.appendChild(dom);
      this.domPool.push(dom);
    }
  }
  initTracks() {
    for (let i = 0; i < this.options.maxTrack; i++) {
      this.tracks.push(new Track());
    }
  }
  emit(data: T[] | T) {
    if (data instanceof Array) {
      this.waitingQueue.push(...data);
    } else {
      this.waitingQueue.push(data);
    }
    if (this.resetOptionsFlag) {
      if (this.waitingQueue[0]) {
        this.initOptions();
      }
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
    this.tracks.forEach((track, trackIndex) => {
      let isRemove = false;
      let removeIndex = -1;
      track.danmus.forEach((danmu, danmuIndex) => {
        if (danmu.stop) {
          return;
        }
        const { dom, offset } = danmu;
        dom.style.transform = `translate(${offset}px, ${
          trackIndex * this.options.trackHeight
        }px)`;
        danmu.offset -= danmu.speed;
        if (danmu.offset < 0 && Math.abs(danmu.offset) > danmu.width + 5) {
          isRemove = true;
          removeIndex = danmuIndex;
          dom.innerHTML = "";
          this.domPool.push(dom);
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
      if (this.options.loop) {
        this.emit(this.waitingQueue.shift() as T);
      } else {
        this.waitingQueue.shift();
      }
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
    const danmu = new Danmu(dom, this.trackWidth);
    const width = (danmu.width = danmu.dom.offsetWidth * scaleRatio);
    // 计算弹幕的速度
    const track = this.tracks[trackId];
    const trackOffset = track.offset;
    const trackWidth = this.trackWidth;
    let speed: number;
    if (isEmptyArray(track.danmus)) {
      speed = this._defaultSpeed * this._speedCoefficient;
    } else {
      const { speed: preSpeed } = track.danmus[track.danmus.length - 1];
      speed = (trackWidth * preSpeed) / trackOffset;
    }
    speed = Math.min(speed, this._defaultSpeed * 2);
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
    this.tracks.forEach((tranck, index) => {
      const trackOffset = tranck.offset;
      if (trackOffset > this.trackWidth) {
        return;
      }
      // 存在多个合适的轨道时，使用剩余空间最大的
      const t = this.trackWidth - trackOffset;
      if (t > max) {
        id = index;
        max = t;
      }
    });
    return id;
  }
}
