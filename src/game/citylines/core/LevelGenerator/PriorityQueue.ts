type PriorityQueueItem<T> = {
  value: T;
  cost: number;
}

type PriorityQueueOptions<T> = {
  sorter?: (c1: PriorityQueueItem<T>, c2: PriorityQueueItem<T>) => number;
}

const defaultSorter = <T>(a: PriorityQueueItem<T>, b: PriorityQueueItem<T>) => {
  return a.cost - b.cost;
}

export class PriorityQueue<T> {
  queue: Array<PriorityQueueItem<T>>;
  sorter: NonNullable<PriorityQueueOptions<T>['sorter']>;

  constructor(opts: PriorityQueueOptions<T>) {
    this.queue = [];
    this.sorter = opts.sorter || defaultSorter<T>;
  }

  static make<T>(opts: PriorityQueueOptions<T>) {
    return new PriorityQueue(opts)
  }

  // Inefficient sort-on-push implementation. For the scale of this generator,
  // it's acceptable, but for larger graphs, a more efficient heap-based
  // priority queue would be a significant performance improvement.
  push(value: T, cost: number) {
    const item = { value: value, cost: cost };

    this.queue.push(item);
    this.queue.sort(this.sorter);
  }

  pop() {
    return this.queue.shift();
  }

  empty() {
    return this.queue.length === 0;
  }
}