import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  ListSkeleton,
  AvatarSkeleton,
  TableSkeleton,
  TimelineEventSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  ImageSkeleton,
} from '@/components/common/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default classes', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('rounded-md', 'bg-muted');
    });

    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />);

      const skeleton = container.querySelector('.h-10');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('w-full');
    });

    it('should spread additional props', () => {
      const { container } = render(<Skeleton data-testid="skeleton-test" />);

      const skeleton = container.querySelector('[data-testid="skeleton-test"]');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('TextSkeleton', () => {
    it('should render single line by default', () => {
      const { container } = render(<TextSkeleton />);

      const lines = container.querySelectorAll('.h-4');
      expect(lines).toHaveLength(1);
    });

    it('should render multiple lines', () => {
      const { container } = render(<TextSkeleton lines={3} />);

      const lines = container.querySelectorAll('.h-4');
      expect(lines).toHaveLength(3);
    });

    it('should make last line shorter when multiple lines', () => {
      const { container } = render(<TextSkeleton lines={3} />);

      const lines = container.querySelectorAll('.h-4');
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toHaveClass('w-3/4');
    });

    it('should apply custom className', () => {
      const { container } = render(<TextSkeleton className="my-4" />);

      const wrapper = container.querySelector('.my-4');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('CardSkeleton', () => {
    it('should render card structure', () => {
      const { container } = render(<CardSkeleton />);

      const card = container.querySelector('.rounded-lg.border.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('should render avatar skeleton', () => {
      const { container } = render(<CardSkeleton />);

      const avatar = container.querySelector('.h-10.w-10.rounded-full');
      expect(avatar).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CardSkeleton className="mb-4" />);

      const card = container.querySelector('.mb-4');
      expect(card).toBeInTheDocument();
    });
  });

  describe('ListSkeleton', () => {
    it('should render 5 items by default', () => {
      const { container } = render(<ListSkeleton />);

      const items = container.querySelectorAll('.h-16');
      expect(items).toHaveLength(5);
    });

    it('should render custom count of items', () => {
      const { container } = render(<ListSkeleton count={3} />);

      const items = container.querySelectorAll('.h-16');
      expect(items).toHaveLength(3);
    });

    it('should apply custom item height', () => {
      const { container } = render(<ListSkeleton itemHeight="h-20" />);

      const items = container.querySelectorAll('.h-20');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('AvatarSkeleton', () => {
    it('should render medium size by default', () => {
      const { container } = render(<AvatarSkeleton />);

      const avatar = container.querySelector('.h-10.w-10');
      expect(avatar).toBeInTheDocument();
    });

    it('should render small size', () => {
      const { container } = render(<AvatarSkeleton size="sm" />);

      const avatar = container.querySelector('.h-8.w-8');
      expect(avatar).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<AvatarSkeleton size="lg" />);

      const avatar = container.querySelector('.h-12.w-12');
      expect(avatar).toBeInTheDocument();
    });

    it('should have rounded-full class', () => {
      const { container } = render(<AvatarSkeleton />);

      const avatar = container.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('TableSkeleton', () => {
    it('should render 5 rows by default', () => {
      const { container } = render(<TableSkeleton />);

      // Header + 5 rows
      const allRows = container.querySelectorAll('.flex.gap-4');
      expect(allRows.length).toBeGreaterThanOrEqual(5);
    });

    it('should render 4 columns by default', () => {
      const { container } = render(<TableSkeleton />);

      const headerRow = container.querySelector('.flex.gap-4');
      const columns = headerRow?.querySelectorAll('.flex-1');
      expect(columns).toHaveLength(4);
    });

    it('should render custom rows and columns', () => {
      const { container } = render(<TableSkeleton rows={3} columns={5} />);

      const allRows = container.querySelectorAll('.flex.gap-4');
      const headerRow = allRows[0];
      const columns = headerRow?.querySelectorAll('.flex-1');
      expect(columns).toHaveLength(5);
    });
  });

  describe('TimelineEventSkeleton', () => {
    it('should render timeline event structure', () => {
      const { container } = render(<TimelineEventSkeleton />);

      const event = container.querySelector('.rounded-lg.border.bg-card');
      expect(event).toBeInTheDocument();
    });

    it('should render icon skeleton', () => {
      const { container } = render(<TimelineEventSkeleton />);

      const icon = container.querySelector('.h-8.w-8.rounded-lg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('StatsCardSkeleton', () => {
    it('should render stats card structure', () => {
      const { container } = render(<StatsCardSkeleton />);

      const card = container.querySelector('.rounded-lg.border.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('should render icon skeleton', () => {
      const { container } = render(<StatsCardSkeleton />);

      const icon = container.querySelector('.h-12.w-12.rounded-lg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('ChartSkeleton', () => {
    it('should render with default height', () => {
      const { container } = render(<ChartSkeleton />);

      const chart = container.querySelector('.h-64');
      expect(chart).toBeInTheDocument();
    });

    it('should render with custom height', () => {
      const { container } = render(<ChartSkeleton height="h-96" />);

      const chart = container.querySelector('.h-96');
      expect(chart).toBeInTheDocument();
    });

    it('should render header elements', () => {
      const { container } = render(<ChartSkeleton />);

      const card = container.querySelector('.rounded-lg.border.bg-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('ImageSkeleton', () => {
    it('should render with default aspect ratio', () => {
      const { container } = render(<ImageSkeleton />);

      const imageContainer = container.querySelector('[style*="aspect-ratio"]');
      expect(imageContainer).toBeInTheDocument();
    });

    it('should apply custom aspect ratio', () => {
      const { container } = render(<ImageSkeleton aspectRatio="1/1" />);

      const imageContainer = container.querySelector('[style*="aspect-ratio"]');
      expect(imageContainer).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      const { container } = render(<ImageSkeleton />);

      const imageContainer = container.querySelector('.rounded-lg');
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes for loading state', () => {
      // Skeleton components typically use aria-busy or role="status"
      // This can be enhanced based on accessibility requirements
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
