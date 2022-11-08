export interface IOptions<T> {
  maxTrack: number;
  maxPool: number;
  duration: number;
  style: Partial<CSSStyleDeclaration>;
  trackHeight: number;
  danmus?: T[];
  loop: boolean;
  render: (arg?: any) => HTMLElement;
}
