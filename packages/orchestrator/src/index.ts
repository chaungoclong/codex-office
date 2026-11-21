export class ConcurrencyGate {
  readonly #waiting: Array<() => void> = [];
  #active = 0;
  readonly limit: number;
  constructor(limit = 4) {
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error("Concurrency limit must be positive");
    this.limit = limit;
  }
  get active(): number {
    return this.#active;
  }
  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.#active >= this.limit)
      await new Promise<void>((resolve) => this.#waiting.push(resolve));
    this.#active += 1;
    try {
      return await work();
    } finally {
      this.#active -= 1;
      this.#waiting.shift()?.();
    }
  }
}
