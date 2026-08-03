import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressDashboardUiComponent } from './progress-dashboard-ui.component';

const meta: Meta<ProgressDashboardUiComponent> = {
  title: 'Components/UI/ProgressDashboardUI',
  component: ProgressDashboardUiComponent,
  tags: ['autodocs'],
  argTypes: {
    filterChanged: { action: 'filterChanged' },
    refreshRequested: { action: 'refreshRequested' },
  },
};

export default meta;
type Story = StoryObj<ProgressDashboardUiComponent>;

/**
 * Default state with balanced progress across all states
 */
export const Default: Story = {
  args: {
    progressStats: {
      total: 100,
      notStarted: 30,
      inProgress: 25,
      understood: 30,
      mastered: 15,
      percentComplete: 45
    },
    lastSyncTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
};

/**
 * Early learning stage - most concepts not started
 */
export const EarlyStage: Story = {
  args: {
    progressStats: {
      total: 50,
      notStarted: 40,
      inProgress: 8,
      understood: 2,
      mastered: 0,
      percentComplete: 4
    },
    lastSyncTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
};

/**
 * Mid learning stage - active learning in progress
 */
export const MidStage: Story = {
  args: {
    progressStats: {
      total: 80,
      notStarted: 20,
      inProgress: 35,
      understood: 20,
      mastered: 5,
      percentComplete: 31
    },
    lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
};

/**
 * Advanced stage - mostly understood or mastered
 */
export const AdvancedStage: Story = {
  args: {
    progressStats: {
      total: 120,
      notStarted: 10,
      inProgress: 15,
      understood: 60,
      mastered: 35,
      percentComplete: 79
    },
    lastSyncTime: new Date(), // Just now
  },
};

/**
 * Complete mastery - all concepts mastered
 */
export const AllMastered: Story = {
  args: {
    progressStats: {
      total: 50,
      notStarted: 0,
      inProgress: 0,
      understood: 0,
      mastered: 50,
      percentComplete: 100
    },
    lastSyncTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
};

/**
 * No sync yet - never synced
 */
export const NoSync: Story = {
  args: {
    progressStats: {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      understood: 0,
      mastered: 0,
      percentComplete: 0
    },
    lastSyncTime: null,
  },
};

/**
 * Small dataset - just a few concepts
 */
export const SmallDataset: Story = {
  args: {
    progressStats: {
      total: 10,
      notStarted: 3,
      inProgress: 2,
      understood: 3,
      mastered: 2,
      percentComplete: 50
    },
    lastSyncTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
  },
};

/**
 * Large dataset - many concepts
 */
export const LargeDataset: Story = {
  args: {
    progressStats: {
      total: 500,
      notStarted: 150,
      inProgress: 125,
      understood: 175,
      mastered: 50,
      percentComplete: 45
    },
    lastSyncTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
};
