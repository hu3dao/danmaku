export interface IDanmakuOptions {
  maxTrack: number,
  maxPool: number,
  duration: number,
  trackHeight: number
}

export interface IDanmuContainer {
  dom: HTMLDivElement,
  isMount: boolean
}


export interface IDanmuObject<T> {
  danmuProps: T,
  speed: number,
  offset: number,
  width: number,
}

export interface IDanmuEventHandler {
  ( position: {left: number, top: number} | undefined): void
}