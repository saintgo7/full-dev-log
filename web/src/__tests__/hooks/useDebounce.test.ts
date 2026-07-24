import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useThrottle,
  useThrottledCallback,
} from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));

    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 300 });

    // Value should not update immediately
    expect(result.current).toBe('initial');

    // Fast forward time and run pending timers
    await vi.runAllTimersAsync();

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'first' });
    await vi.advanceTimersByTimeAsync(100);

    rerender({ value: 'second' });
    await vi.advanceTimersByTimeAsync(100);

    rerender({ value: 'third' });
    await vi.advanceTimersByTimeAsync(300);

    expect(result.current).toBe('third');
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    await vi.advanceTimersByTimeAsync(300);
    expect(result.current).toBe('initial');

    await vi.advanceTimersByTimeAsync(200);
    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('value', 300));

    unmount();

    // Should not throw error
    vi.advanceTimersByTime(300);
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should debounce callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('test');
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should cancel previous call on rapid invocations', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('first');
    vi.advanceTimersByTime(100);

    result.current('second');
    vi.advanceTimersByTime(100);

    result.current('third');
    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 300)
    );

    result.current('test');
    unmount();

    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should update callback ref when callback changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useDebouncedCallback(cb, 300),
      {
        initialProps: { cb: callback1 },
      }
    );

    result.current('test');

    // Change callback before timeout
    rerender({ cb: callback2 });

    vi.advanceTimersByTime(300);

    // New callback should be called
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith('test');
  });
});

describe('useDebouncedState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return immediate and debounced values', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 300));

    const [immediateValue, debouncedValue] = result.current;

    expect(immediateValue).toBe('initial');
    expect(debouncedValue).toBe('initial');
  });

  it('should update immediate value instantly', () => {
    const { result } = renderHook(() => useDebouncedState('initial', 300));

    result.current[2]('updated');

    expect(result.current[0]).toBe('updated');
  });

  it('should debounce the second value', async () => {
    const { result } = renderHook(() => useDebouncedState('initial', 300));

    result.current[2]('updated');

    // Immediate value updates
    expect(result.current[0]).toBe('updated');
    expect(result.current[1]).toBe('initial');

    // Advance timers
    await vi.runAllTimersAsync();

    expect(result.current[1]).toBe('updated');
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 300));

    expect(result.current).toBe('initial');
  });

  it('should throttle value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    // First update should go through immediately
    rerender({ value: 'first' });
    await vi.advanceTimersByTimeAsync(0);

    expect(result.current).toBe('first');

    // Rapid updates within interval should be throttled
    rerender({ value: 'second' });
    await vi.advanceTimersByTimeAsync(100);

    // Still should be 'first'
    expect(result.current).toBe('first');

    // After interval, should update
    await vi.advanceTimersByTimeAsync(200);

    expect(result.current).toBe('second');
  });
});

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute callback immediately on first call', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 300));

    result.current('test');
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should throttle subsequent calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 300));

    result.current('first');
    expect(callback).toHaveBeenCalledTimes(1);

    result.current('second');
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useThrottledCallback(callback, 300)
    );

    result.current('first');
    result.current('second');

    unmount();

    vi.advanceTimersByTime(300);
    // Should only have been called once (immediately)
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
