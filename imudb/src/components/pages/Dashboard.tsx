import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardMap from '../map/DashboardMap';
import '../../styles/Dashboard.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Site } from '../../types/site';

// Function to fetch sites (can be moved to a shared API file later)
const fetchSitesForDashboard = async (): Promise<Site[]> => {
  const { data, error } = await supabase
    .from('site')
    .select('site_id, site_name, latitude, longitude');

  if (error) {
    console.error('Error fetching sites for dashboard:', error);
    throw new Error(error.message);
  }
  return (data || []).map(item => ({
    id: item.site_id,
    name: item.site_name,
    position: [item.latitude, item.longitude] as [number, number],
    // status and type are optional in Site type, so no need to explicitly add them if not fetched
  })) as Site[];
};

// Function to fetch pending edits count
const fetchPendingEditsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('pending_edits')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending edits count:', error);
    throw new Error(error.message);
  }
  return count || 0;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [mapFilters, setMapFilters] = useState({
    sites: true,
    devices: false,
    fiber: false
  });

  const { 
    data: sites = [], 
    isLoading: sitesLoading, 
    isError: sitesError 
  } = useQuery<Site[], Error>({
    queryKey: ['dashboardSites'],
    queryFn: fetchSitesForDashboard,
    staleTime: 120000, // Example: refetch after 2 minutes
  });

  const { 
    data: pendingEditsCount = 0, 
    isLoading: pendingEditsLoading, 
    isError: pendingEditsError 
  } = useQuery<number, Error>({
    queryKey: ['pendingEditsCount'],
    queryFn: fetchPendingEditsCount,
    staleTime: 60000, // Example: refetch after 1 minute
  });

  const toggleFilter = (filter: 'sites' | 'devices' | 'fiber') => {
    setMapFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Mock data for sites - replace with actual data from your API
  // const siteData = [
  //   { id: 1, name: 'Ghantaghar', position: [27.0128, 84.8773] as [number, number], status: 'Active' },
  //   { id: 2, name: 'Birgunj Bus Park', position: [27.0156, 84.8801] as [number, number], status: 'Active' },
  //   { id: 3, name: 'Gandak Terminal', position: [27.0089, 84.8744] as [number, number], status: 'Maintenance' }
  // ];
  const siteData = sites; // Use fetched sites

  return (
    <section className="dashboard-widgets">
      <div className="widget-row equal-columns">
        <div className="widget kpi-combined-widget">
          <h3>System Overview</h3>
          <div className="kpi-container horizontal">
            <div className="kpi-item">
              <h4>Managed Sites</h4>
              <p className="kpi-number">{sitesLoading ? '...' : sitesError ? 'Err' : siteData.length}</p>
              <p>Total sites</p>
              <button onClick={() => navigate('/sites')} className="link">View Sites &rarr;</button>
            </div>
            <div className="kpi-item warning">
              <h4>Pending Edits</h4>
              <p className="kpi-number">{pendingEditsLoading ? '...' : pendingEditsError ? 'Err' : pendingEditsCount}</p>
              <p>Need review</p>
              <button onClick={() => navigate('/pending-edits')} className="button">Review</button>
            </div>
          </div>
        </div>
        
        <div className="widget activity-widget">
          <h3>Recent Activity</h3>
          <ul className="compact-list">
            <li><span>[2025-03-30]</span> Edit for 'SITE-0101'</li>
            <li><span>[2025-03-30]</span> Approved 'SITE-0098'</li>
            <li><span>[2025-03-29]</span> Added 'SITE-1235'</li>
            <li><span>[2025-03-29]</span> Rejected 'SITE-0100'</li>
            <li><span>[2025-03-29]</span> User 'Field Ops B' downloaded data</li>
            <li><span>[2025-03-28]</span> Added 'SITE-1230'</li>
          </ul>
          <div className="actions-row">
            <button onClick={() => navigate('/recent-updates')} className="link">View All Updates &rarr;</button>
          </div>
        </div>
      </div>

      <div className="widget-row">
        <div className="widget map-widget full-width">
          <h3>Site Map Overview</h3>
          <div className="map-filters">
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={mapFilters.sites} 
                onChange={() => toggleFilter('sites')} 
              />
              <span>Sites</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={mapFilters.devices} 
                onChange={() => toggleFilter('devices')} 
              />
              <span>Devices</span>
            </label>
            <label className="filter-option">
              <input 
                type="checkbox" 
                checked={mapFilters.fiber} 
                onChange={() => toggleFilter('fiber')} 
              />
              <span>Fiber</span>
            </label>
          </div>
          <DashboardMap sites={mapFilters.sites ? siteData : []} />
        </div>
      </div>
    </section>
  );
};

export default Dashboard; 