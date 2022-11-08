export default class Danmu {
  dom: HTMLElement;
  offset: number = 0;
  speed: number = 0;
  width: number = 0;
  stop: boolean = false;
  constructor(dom: HTMLElement, left: number) {
    this.dom = dom;
    this.offset = left;
  }
}
