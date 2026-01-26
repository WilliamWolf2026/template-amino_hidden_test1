// --- DETERMINISTIC PRNG IMPLEMENTATION ---
// This is an implementation of the XoroShiro128+ pseudo-random number generator.
// The primary reason for using a custom PRNG instead of `Math.random()` is for
// determinism. Given the same initial `seed`, this generator will always produce
// the exact same sequence of numbers. This is essential for procedural content
// generation, as it allows for level layouts to be perfectly reproducible,
// which is critical for debugging, sharing levels, and maintaining consistency.
// Note: source: https://github.com/dubzzz/pure-rand/blob/main/src/generator/XoroShiro.ts
export class XoroShiro128Plus {
  constructor(
    private s01: number,
    private s00: number,
    private s11: number,
    private s10: number,
  ) {}

  // Generates the next pseudo-random number in the sequence.
  unsafeNext(): number {
    const out = (this.s00 + this.s10) | 0;
    const a0 = this.s10 ^ this.s00;
    const a1 = this.s11 ^ this.s01;
    const s00 = this.s00;
    const s01 = this.s01;

    this.s00 = (s00 << 24) ^ (s01 >>> 8) ^ a0 ^ (a0 << 16);
    this.s01 = (s01 << 24) ^ (s00 >>> 8) ^ a1 ^ ((a1 << 16) | (a0 >>> 16));
    this.s10 = (a1 << 5) ^ (a0 >>> 27);
    this.s11 = (a0 << 5) ^ (a1 >>> 27);

    return out;
  }

  // Jumps the generator state forward. This is useful for creating distinct,
  // non-overlapping sequences of random numbers from the same seed, for example,
  // by calling `jump()` once per generator instance.
  unsafeJump(): void {
    let ns01 = 0,
      ns00 = 0,
      ns11 = 0,
      ns10 = 0;
    const jump = [0xd8f554a5, 0xdf900294, 0x4b3201fc, 0x170865df];

    for (let i = 0; i !== 4; ++i) {
      for (let mask = 1; mask; mask <<= 1) {
        if (jump[i] & mask) {
          ns01 ^= this.s01;
          ns00 ^= this.s00;
          ns11 ^= this.s11;
          ns10 ^= this.s10;
        }
        this.unsafeNext();
      }
    }

    this.s01 = ns01;
    this.s00 = ns00;
    this.s11 = ns11;
    this.s10 = ns10;
  }

  // Creates a new generator instance from a single numerical seed.
  static fromSeed(seed: number) {
    return new XoroShiro128Plus(-1, ~seed, seed | 0, 0);
  }

  // Generates an integer within a specific range. It uses a debiasing technique
  // (the `while` loop) to ensure a uniform distribution, preventing common
  // modulo bias issues.
  unsafeUniformIntDistributionInternal(rangeSize: number): number {
    const MaxAllowed =
      rangeSize > 2 ? ~~(0x100000000 / rangeSize) * rangeSize : 0x100000000;
    let deltaV = this.unsafeNext() + 0x80000000;

    while (deltaV >= MaxAllowed) {
      deltaV = this.unsafeNext() + 0x80000000;
    }

    return deltaV % rangeSize;
  }
}
