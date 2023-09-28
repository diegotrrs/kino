import type { Meta, StoryObj } from '@storybook/react';

import CalendarCard from './CalendarCard';
import '@/app/css/style.css'
import CalendarFactory from './CalendarCardFactory';


// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export

const calendar = CalendarFactory.build()

const meta = {
  title: 'kino/CalendarCard',
  component: CalendarCard,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'], 
} satisfies Meta<typeof CalendarCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {
    calendar,
  },
};
