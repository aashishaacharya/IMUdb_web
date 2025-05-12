export interface Site {
  id: number | string;
  name: string;
  position: [number, number]; // [latitude, longitude]
  status?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SiteFilters {
  sites: boolean;
  devices: boolean;
  fiber: boolean;
}

export interface SiteSummary {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
} 