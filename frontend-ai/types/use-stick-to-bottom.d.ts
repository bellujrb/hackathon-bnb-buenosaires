declare module 'use-stick-to-bottom' {
  import * as React from 'react';

  export type SmoothMode = 'auto' | 'smooth' | 'instant';

  export interface StickToBottomProps
    extends React.HTMLAttributes<HTMLDivElement> {
    initial?: SmoothMode;
    resize?: SmoothMode;
  }

  export const StickToBottom: React.FC<StickToBottomProps> & {
    Content: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  };

  export function useStickToBottomContext(): {
    isAtBottom: boolean;
    scrollToBottom: () => void;
  };
}


