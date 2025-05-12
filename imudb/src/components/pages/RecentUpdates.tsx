import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Dashboard.css';

const RecentUpdates: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Mock data - in real app would be fetched from an API
  const recentUpdates = [
    { date: '2025-03-30 01:45', user: 'Tech A', action: 'suggested edit', target: 'SITE-0101' },
    { date: '2025-03-30 01:30', user: 'Admin', action: 'approved edit', target: 'SITE-0098' },
    { date: '2025-03-29 18:00', user: 'Admin', action: 'added new site', target: 'SITE-1235' },
    { date: '2025-03-29 17:55', user: 'Huawei PM', action: 'logged in', target: '' },
    { date: '2025-03-29 15:20', user: 'Admin', action: 'rejected edit', target: 'SITE-0100' },
    { date: '2025-03-29 11:10', user: 'Field Ops B', action: 'downloaded bulk data', target: '' },
    { date: '2025-03-28 14:35', user: 'Tech C', action: 'suggested edit', target: 'SITE-0095' },
    { date: '2025-03-28 10:15', user: 'Admin', action: 'added new site', target: 'SITE-1230' },
    { date: '2025-03-27 16:40', user: 'Tech B', action: 'suggested edit', target: 'SITE-0088' },
    { date: '2025-03-27 09:30', user: 'Admin', action: 'approved edit', target: 'SITE-0082' },
    { date: '2025-03-26 18:15', user: 'Field Ops A', action: 'logged in', target: '' },
    { date: '2025-03-26 14:20', user: 'Admin', action: 'rejected edit', target: 'SITE-0075' },
    { date: '2025-03-26 11:05', user: 'Tech A', action: 'suggested edit', target: 'SITE-0070' },
    { date: '2025-03-25 17:30', user: 'Admin', action: 'added new site', target: 'SITE-1225' },
    { date: '2025-03-25 13:40', user: 'System', action: 'backup completed', target: '' },
  ];

  return (
    <div className="updates-page">
      <div className="page-header">
        <h1>Recent Activity</h1>
        <button onClick={() => navigate(-1)} className="button back-button">
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="widget activity-log">
        <h3>System Activity Log</h3>
        <div className="filter-bar">
          <input 
            type="text" 
            placeholder="Search activity..." 
            className="search-input" 
          />
          <select className="filter-select">
            <option value="all">All Activities</option>
            <option value="edits">Site Edits</option>
            <option value="new">New Sites</option>
            <option value="logins">User Logins</option>
          </select>
        </div>
        <table className="activity-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              {userProfile?.role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {recentUpdates.map((update, index) => (
              <tr key={index}>
                <td>{update.date}</td>
                <td>{update.user}</td>
                <td>{update.action}</td>
                <td>
                  {update.target && (
                    <button 
                      onClick={() => navigate(`/sites/${update.target}`)} 
                      className="link table-link"
                    >
                      {update.target}
                    </button>
                  )}
                  {!update.target && '-'}
                </td>
                {userProfile?.role === 'admin' && (
                  <td>
                    {update.action.includes('edit') && (
                      <button className="link">View Details</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button className="page-button active">1</button>
          <button className="page-button">2</button>
          <button className="page-button">3</button>
          <span>...</span>
          <button className="page-button">10</button>
        </div>
      </div>
    </div>
  );
};

export default RecentUpdates; 