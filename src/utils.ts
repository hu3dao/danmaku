function isHtmlEle(el: any) {
  return el instanceof HTMLElement
}

function getEl(el: HTMLElement | string): HTMLElement {
  const _el = typeof el === 'string' ? document.querySelector(el) : el
  if(!isHtmlEle(_el)) {
    throw new Error('Type Error: el is not HTMLElement')
  }
  return _el as HTMLElement
}

function createDanmuContainer(trackWidth: number) {
  const danmuContainer = document.createElement('div')
  danmuContainer.style.display = "inline-block"
  danmuContainer.style.transform = `translate(${trackWidth}px, ${0}px)`
  return danmuContainer
}

function isObject(value: any) {
  const type = Object.prototype.toString.call(value)
  return type === '[object Object]'
}
function isArray(value: any) {
  return Array.isArray(value)
}
function isEmptyArray<T>(array: T[]): boolean {
  return array.length === 0
}
export {
  isHtmlEle,
  getEl,
  createDanmuContainer,
  isObject,
  isArray,
  isEmptyArray
}