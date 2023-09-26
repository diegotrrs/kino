import type { Meta, StoryObj } from '@storybook/react';

import CalendarCard from './CalendarCard';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export

const calendar = {
  id: 0,
  category: '1',      
  title: 'Monitor progress in Real Time Value',
  link: '#0',
  content: 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.',
  dates: {
    from: 'Jan 20',
    to: 'Jan 27'
  },
  type: 'One-Time'
}

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
