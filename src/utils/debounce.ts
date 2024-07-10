export function debounce<T extends (...args: unknown[]) => void>(func: T, delay = 500) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Debounce function with event accumulation
export function debounceWithEvents<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  let events: Parameters<T>[] = [];
  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    events.push(args);
    timer = setTimeout(() => {
      func(events);
      events = [];
    }, delay);
  };
}
