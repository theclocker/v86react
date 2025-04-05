import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { V86WithWorker } from './v86WithWorker';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Components/V86WithWorker',
  component: V86WithWorker,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
} satisfies Meta<typeof V86WithWorker>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    stateUrl: "/public/v86/v86state.bin.zst",
    config: {
      wasm_path: '/public/v86/v86.wasm',
      bios_path: '/public/v86/vm/bios/seabios.bin',
      vgabios_path: '/public/v86/vm/bios/vgabios.bin',
      filesystem_basefs: '/public/v86/vm/fs/alpine-fs.json',
      filesystem_baseurl: '/public/v86/vm/fs/alpine-rootfs-flat/',
    }
  },
};
