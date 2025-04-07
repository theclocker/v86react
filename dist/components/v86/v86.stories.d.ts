import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: ({ stateUrl, config }: {
        stateUrl?: string;
        config?: import("../../hooks/useV86").V86Config;
    }) => import("react/jsx-runtime").JSX.Element;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {};
};
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Primary: Story;
