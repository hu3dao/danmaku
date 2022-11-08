import Danmu from "./danmu";

export default class Track<T> {
  danmus: Danmu<T>[] = [];
  offset: number = 0;
  top: number = 0;

  constructor(top: number) {
    this.top = top;
  }

  push(danmu: Danmu<T>) {
    this.danmus.push(danmu);
  }
  remove() {
    this.danmus.shift();
  }
  removeOfIndex(index: number) {
    if (index < 0 || index >= this.danmus.length) {
      return;
    }
    return this.danmus.splice(index, 1)[0];
  }
  reset() {
    this.danmus = [];
    this.offset = 0;
  }

  updateOffset() {
    const lastDanmu = this.danmus[this.danmus.length - 1];
    if (lastDanmu) {
      const { speed } = lastDanmu;
      this.offset -= speed;
    }
  }
}
