export type TourId = 'console' | 'admin';

export interface TourStepPopover {
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export interface TourStepConfig {
  /** CSS selector of the element to highlight */
  element: string;
  /** Route to navigate to before showing this step */
  route?: string;
  popover: TourStepPopover;
}
