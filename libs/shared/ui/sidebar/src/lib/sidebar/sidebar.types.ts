export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: SidebarItem[];
  isActive?: boolean;
  isExpanded?: boolean;
  permission?: string;
}

export interface SidebarConfig {
  collapsed: boolean;
  showToggle: boolean;
  theme: 'light' | 'dark';
  width: string;
  collapsedWidth: string;
}