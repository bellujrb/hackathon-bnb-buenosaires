'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ActionsProps = ComponentProps<'div'>;

export const Actions = ({ className, children, ...props }: ActionsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props}>
    {children}
  </div>
);

export type ActionProps = Omit<ButtonProps, 'children' | 'size' | 'variant'> & {
  tooltip?: string;
  label?: string;
  children?: ReactNode;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
};

export const Action = ({
  tooltip,
  children,
  label,
  className,
  variant = 'ghost' as ButtonProps['variant'],
  size = 'icon' as ButtonProps['size'],
  ...props
}: ActionProps) => {
  const button = (
    <Button
      className={cn(
        'size-9 p-1.5 text-muted-foreground hover:text-foreground',
        // feedback visual de interatividade
        'transition-colors duration-150 hover:bg-white/10 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#F3BA2F]/40 rounded-md',
        className,
      )}
      size={size}
      type="button"
      variant={variant}
      aria-label={label || tooltip}
      {...props}
    >
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};


