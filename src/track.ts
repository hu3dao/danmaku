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