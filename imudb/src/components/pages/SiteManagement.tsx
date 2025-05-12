import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layout/PageLayout';
import '../../styles/PageLayout.css';

const SiteManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - this would come from your API/database in a real app
  const sites = [
    { id: 'SITE-0001', name: 'Birgunj Central', type: 'Hub', status: 'Active', lastUpdated: '2025-03-15' },
    { id: 'SITE-0002', name: 'Parsa Gateway', type: 'Gateway', status: 'Active', lastUpdated: '2025-03-10' },
    { id: 'SITE-0003', name: 'Janakpur Link', type: 'Terminal', status: 'Maintenance', lastUpdated: '2025-03-05' },
    { id: 'SITE-0004', name: 'Pokhara Exchange', type: 'Hub', status: 'Active', lastUpdated: '2025-02-28' },
    { id: 'SITE-0005', name: 'Kathmandu Main', type: 'Core', status: 'Active', lastUpdated: '2025-02-15' },
  ];

  const filteredSites = sites.filter(site => 
    site.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    site.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Actions for the header
  const actions = (
    <>
      <button className="button" onClick={() => navigate('/sites/new')}>+ Add New Site</button>
      <button className="button" onClick={() => navigate('/export')}>Export</button>
    </>
  );

  return (
    <PageLayout title="Site Management" actions={actions}>
      <div className="content-card">
        <div className="filter-row">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search by ID or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="filter-actions">
            <button className="button">Filter</button>
            <button className="link">Clear</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Site Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map(site => (
                <tr key={site.id}>
                  <td>{site.id}</td>
                  <td>{site.name}</td>
                  <td>{site.type}</td>
                  <td>
                    <span className={`status-badge ${site.status.toLowerCase()}`}>
                      {site.status}
                    </span>
                  </td>
                  <td>{site.lastUpdated}</td>
                  <td>
                    <div className="row-actions">
                      <button className="link" onClick={() => navigate(`/sites/${site.id}`)}>View</button>
                      <button className="link" onClick={() => navigate(`/sites/${site.id}/edit`)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-card">
        <h2>Site Statistics</h2>
        <div className="content-card-row">
          <div className="stat-box">
            <div className="stat-value">125</div>
            <div className="stat-label">Total Sites</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">86</div>
            <div className="stat-label">Active Sites</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">12</div>
            <div className="stat-label">Maintenance</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">27</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SiteManagement; 