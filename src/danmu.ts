export default class Danmu<T> {
  dom: HTMLElement;
  offset: number = 0;
  speed: number = 0;
  width: number = 0;
  danmuObject: T;
  constructor(dom: HTMLElement, left: number, danmuObject: T) {
    this.dom = dom;
    this.offset = left;
    this.danmuObject = danmuObject;
  }
}
