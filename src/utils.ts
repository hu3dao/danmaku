export const getEl = (el: HTMLElement | string) => {
  const _el = typeof el === "string" ? document.querySelector(el) : el;
  if (!_el || !(_el instanceof HTMLElement)) {
    throw new Error("Type Error: el is not HTMLElement");
  }
  if (!getComputedStyle(_el).position) {
    _el.style["position"] = "relative";
  }
  return _el as HTMLElement;
};

export function isEmptyArray<T>(array: T[]): boolean {
  return array.length === 0;
}
