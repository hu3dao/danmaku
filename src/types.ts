export interface IOptions<T> {
  maxTrack: number;
  maxPool: number;
  duration: number;
  autoPlay: boolean;
  style: Partial<CSSStyleDeclaration>;
  danmus?: T[];
  loop: boolean;
  render: (arg?: any) => HTMLElement;
}
