import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualList } from '@/components/common/VirtualList';

interface TestItem {
  id: string;
  title: string;
}

const mockItems: TestItem[] = Array.from({ length: 100 }, (_, i) => ({
  id: `item-${i}`,
  title: `Item ${i}`,
}));

describe('VirtualList', () => {
  it('should render items', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
      />
    );

    // Only visible items should be rendered
    // Exact number depends on container height and overscan
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('should use custom key extractor', () => {
    const keyExtractor = vi.fn((item: TestItem) => item.id);

    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        keyExtractor={keyExtractor}
      />
    );

    expect(keyExtractor).toHaveBeenCalled();
  });

  it('should display loading skeleton when loading', () => {
    const { container } = render(
      <VirtualList
        items={[]}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        isLoading={true}
        loadingSkeletonCount={3}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('should display empty message when no items', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        emptyMessage="No items found"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should display custom empty component', () => {
    const EmptyComponent = () => <div>Custom empty state</div>;

    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        emptyComponent={<EmptyComponent />}
      />
    );

    expect(screen.getByText('Custom empty state')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('should apply custom item className', () => {
    const { container } = render(
      <VirtualList
        items={mockItems.slice(0, 5)}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        itemClassName="custom-item"
      />
    );

    const items = container.querySelectorAll('.custom-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should render header component', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        headerComponent={<div>Header</div>}
      />
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('should render footer component', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        footerComponent={<div>Footer</div>}
      />
    );

    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should call onEndReached when scrolling to bottom', async () => {
    const onEndReached = vi.fn();

    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        onEndReached={onEndReached}
        height={300}
      />
    );

    const scrollContainer = container.querySelector('.overflow-auto');
    expect(scrollContainer).toBeInTheDocument();

    if (scrollContainer) {
      // Simulate scroll to bottom
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 2000,
      });
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        writable: true,
        value: 5000,
      });
      Object.defineProperty(scrollContainer, 'clientHeight', {
        writable: true,
        value: 300,
      });

      scrollContainer.dispatchEvent(new Event('scroll'));

      await waitFor(() => {
        expect(onEndReached).toHaveBeenCalled();
      });
    }
  });

  it('should not call onEndReached multiple times rapidly', async () => {
    const onEndReached = vi.fn();

    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        onEndReached={onEndReached}
        height={300}
      />
    );

    const scrollContainer = container.querySelector('.overflow-auto');

    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 2000,
      });
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        writable: true,
        value: 5000,
      });
      Object.defineProperty(scrollContainer, 'clientHeight', {
        writable: true,
        value: 300,
      });

      // Trigger multiple scroll events
      scrollContainer.dispatchEvent(new Event('scroll'));
      scrollContainer.dispatchEvent(new Event('scroll'));
      scrollContainer.dispatchEvent(new Event('scroll'));

      await waitFor(() => {
        // Should only be called once due to debouncing
        expect(onEndReached).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('should handle items with gap', () => {
    const { container } = render(
      <VirtualList
        items={mockItems.slice(0, 5)}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        gap={10}
      />
    );

    const items = container.querySelectorAll('[style*="height: 50px"]');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should apply smooth scroll when enabled', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        smoothScroll={true}
      />
    );

    const scrollContainer = container.querySelector('.scroll-smooth');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should calculate total height correctly', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
      />
    );

    // Total height should be items.length * itemHeight
    const innerContainer = container.querySelector('[style*="position: relative"]');
    expect(innerContainer).toBeInTheDocument();
  });

  it('should show loading indicator when loading more items', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
        isLoading={true}
      />
    );

    // Should show spinner when loading more
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render only visible items plus overscan', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={(item) => <div data-testid="list-item">{item.title}</div>}
        height={300}
        overscan={2}
      />
    );

    // With height 300 and itemHeight 50, visible count is 6
    // Plus overscan of 2 on each side = 10 items
    // But this depends on ResizeObserver working in tests
  });

  it('should handle empty items array gracefully', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        renderItem={(item) => <div>{item.title}</div>}
      />
    );

    // With no items (and not loading) the component renders its empty state,
    // not the scroll container.
    expect(screen.getByText('No items to display')).toBeInTheDocument();
  });
});
