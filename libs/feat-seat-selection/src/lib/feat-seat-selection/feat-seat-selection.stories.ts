import type { Meta, StoryObj } from '@storybook/angular';
import { FeatSeatSelection } from './feat-seat-selection';

const meta: Meta<FeatSeatSelection> = {
  title: 'Features/Seat Selection',
  component: FeatSeatSelection,
};

export default meta;
type Story = StoryObj<FeatSeatSelection>;

export const Default: Story = {};
