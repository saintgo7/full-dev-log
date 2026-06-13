import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamCard } from '@/components/teams/TeamCard';
import type { Team } from '@/types';

const mockTeam: Team = {
  id: 'team-1',
  name: 'Development Team',
  description: 'Main development team for the project',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: 'user-1',
  owner: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  _count: {
    members: 5,
    projects: 3,
    sharedNotes: 12,
  },
};

const mockTeamWithoutDescription: Team = {
  ...mockTeam,
  description: null,
};

const mockTeamNoCounts: Team = {
  ...mockTeam,
  _count: undefined,
};

describe('TeamCard', () => {
  it('should render team name', () => {
    render(<TeamCard team={mockTeam} />);

    expect(screen.getByText('Development Team')).toBeInTheDocument();
  });

  it('should render team description when provided', () => {
    render(<TeamCard team={mockTeam} />);

    expect(
      screen.getByText('Main development team for the project')
    ).toBeInTheDocument();
  });

  it('should not render description when null', () => {
    render(<TeamCard team={mockTeamWithoutDescription} />);

    expect(
      screen.queryByText('Main development team for the project')
    ).not.toBeInTheDocument();
  });

  it('should display member count', () => {
    render(<TeamCard team={mockTeam} />);

    expect(screen.getByText('5 멤버')).toBeInTheDocument();
  });

  it('should display project count', () => {
    render(<TeamCard team={mockTeam} />);

    expect(screen.getByText('3 프로젝트')).toBeInTheDocument();
  });

  it('should display note count', () => {
    render(<TeamCard team={mockTeam} />);

    expect(screen.getByText('12 노트')).toBeInTheDocument();
  });

  it('should display owner name', () => {
    render(<TeamCard team={mockTeam} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display owner avatar with first letter', () => {
    render(<TeamCard team={mockTeam} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should handle missing counts gracefully', () => {
    render(<TeamCard team={mockTeamNoCounts} />);

    expect(screen.getByText('0 멤버')).toBeInTheDocument();
    expect(screen.getByText('0 프로젝트')).toBeInTheDocument();
    expect(screen.getByText('0 노트')).toBeInTheDocument();
  });

  it('should be wrapped in a link to team page', () => {
    const { container } = render(<TeamCard team={mockTeam} />);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/teams/team-1');
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <TeamCard team={mockTeam} className="custom-class" />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should have hover transition classes', () => {
    const { container } = render(<TeamCard team={mockTeam} />);

    const card = container.querySelector('.hover\\:bg-accent\\/50');
    expect(card).toBeInTheDocument();
  });

  it('should render chevron icon', () => {
    const { container } = render(<TeamCard team={mockTeam} />);

    // Check for ChevronRight icon via SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display all stat icons', () => {
    const { container } = render(<TeamCard team={mockTeam} />);

    const svgs = container.querySelectorAll('svg');
    // Should have: ChevronRight, Users, FolderKanban, StickyNote icons
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it('should truncate long team name', () => {
    const longNameTeam = {
      ...mockTeam,
      name: 'This is a very long team name that should be truncated',
    };

    const { container } = render(<TeamCard team={longNameTeam} />);

    const title = container.querySelector('.truncate');
    expect(title).toBeInTheDocument();
  });

  it('should clamp description to 2 lines', () => {
    const longDescriptionTeam = {
      ...mockTeam,
      description:
        'This is a very long description that should be clamped to two lines maximum. It contains a lot of text that would normally overflow the card layout.',
    };

    const { container } = render(<TeamCard team={longDescriptionTeam} />);

    const description = container.querySelector('.line-clamp-2');
    expect(description).toBeInTheDocument();
  });
});
