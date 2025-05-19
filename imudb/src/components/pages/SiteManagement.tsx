import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layout/PageLayout';
import '../../styles/PageLayout.css';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';

// Define an interface for the site_configuration data
interface SiteConfig {
  config_2g: string | null;
  config_3g: string | null;
  config_4g: string | null;
  band_2g: string | null;
  band_3g: string | null;
  band_4g: string | null;
}

// Update Site interface to include nested site_configuration
interface Site {
  site_id: string;
  site_name: string;
  district: string | null;
  site_type: string | null;
  tower_type: string | null;
  site_configuration: SiteConfig | SiteConfig[] | null; // Supabase might return array for 1-to-1 if FK isn't unique, but here it's PK so object or null
}

// Function to fetch sites - updated to join site_configuration
const fetchSites = async (): Promise<Site[]> => {
  const { data, error } = await supabase
    .from('site')
    .select(`
      site_id,
      site_name,
      district,
      site_type,
      tower_type,
      site_configuration ( 
        config_2g,
        config_3g,
        config_4g,
        band_2g,
        band_3g,
        band_4g
      )
    `);

  if (error) {
    console.error('Error fetching sites:', error);
    throw new Error(error.message);
  }
  // Ensure site_configuration is an object or null, not an array, for 1-to-1
  return (data || []).map(site => ({
    ...site,
    site_configuration: Array.isArray(site.site_configuration) && site.site_configuration.length > 0 
                          ? site.site_configuration[0] 
                          : site.site_configuration
  })) as Site[];
};

// Define types for the statistic filters
type StatFilterType = 
  | '2G_ONLY' 
  | 'NO_4G' 
  | '4G_800_ONLY' 
  | '4G_1800_ONLY' 
  | '4G_DUAL_BAND'
  | 'HAS_2G'
  | 'HAS_4G'
  | null;

const SiteManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilterType>(null);
  const { userProfile } = useAuth();

  const { 
    data: sites = [],
    isLoading,
    isError,
    error,
  } = useQuery<Site[], Error>({
    queryKey: ['sites'],
    queryFn: fetchSites,
    staleTime: 120000, 
  });
  
  const handleStatBoxClick = (filterType: StatFilterType) => {
    setActiveStatFilter(currentFilter => (currentFilter === filterType ? null : filterType));
  };

  const siteStats = useMemo(() => {
    if (!sites || sites.length === 0) {
      return {
        totalSites: 0,
        total2GSites: 0,
        total4GSites: 0,
        twoGOnly: 0,
        noFourG: 0,
        fourG800Only: 0,
        fourG1800Only: 0,
        fourGDualBand: 0,
      };
    }

    let total2GSites = 0;
    let total4GSites = 0;
    let twoGOnly = 0;
    let noFourG = 0;
    let fourG800Only = 0;
    let fourG1800Only = 0;
    let fourGDualBand = 0;

    sites.forEach(site => {
      const config = site.site_configuration as SiteConfig | null;
      const b2g = config?.band_2g;
      const b3g = config?.band_3g;
      const b4g = config?.band_4g;

      const has2G = b2g && b2g !== '0' && b2g.trim() !== '';
      const has3G = b3g && b3g !== '0' && b3g.trim() !== '';
      const has4G = b4g && b4g !== '0' && b4g.trim() !== '';

      if (has2G) {
        total2GSites++;
      }
      if (has4G) {
        total4GSites++;
      }

      if (has2G && !has3G && !has4G) {
        twoGOnly++;
      }
      if (!has4G) {
        noFourG++;
      }

      if (b4g && b4g.trim() !== '' && b4g !== '0') {
        const fourGBands = b4g.toLowerCase().split(/[\+\/]/).map(s => s.trim());
        const is800 = fourGBands.includes('800');
        const is1800 = fourGBands.includes('1800');

        if (is800 && !is1800 && fourGBands.length === 1) {
          fourG800Only++;
        } else if (!is800 && is1800 && fourGBands.length === 1) {
          fourG1800Only++;
        } else if (is800 && is1800) {
          fourGDualBand++;
        }
      }
    });

    return {
      totalSites: sites.length,
      total2GSites,
      total4GSites,
      twoGOnly,
      noFourG,
      fourG800Only,
      fourG1800Only,
      fourGDualBand,
    };
  }, [sites]);
  
  const filteredSites = useMemo(() => {
    let tempSites = sites.filter(site => {
      const siteIdName = `${site.site_id}_${site.site_name}`;
      return siteIdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (site.district && site.district.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    if (activeStatFilter) {
      tempSites = tempSites.filter(site => {
        const config = site.site_configuration as SiteConfig | null;
        const b2g = config?.band_2g;
        const b3g = config?.band_3g;
        const b4g = config?.band_4g;
        const has2G = b2g && b2g !== '0' && b2g.trim() !== '';
        const has3G = b3g && b3g !== '0' && b3g.trim() !== '';
        const has4G = b4g && b4g !== '0' && b4g.trim() !== '';

        switch (activeStatFilter) {
          case 'HAS_2G': return has2G;
          case 'HAS_4G': return has4G;
          case '2G_ONLY': return has2G && !has3G && !has4G;
          case 'NO_4G': return !has4G;
          case '4G_800_ONLY':
            if (b4g && b4g.trim() !== '' && b4g !== '0') {
              const fourGBands = b4g.toLowerCase().split(/[\+\/]/).map(s => s.trim());
              return fourGBands.includes('800') && !fourGBands.includes('1800') && fourGBands.length === 1;
            }
            return false;
          case '4G_1800_ONLY':
            if (b4g && b4g.trim() !== '' && b4g !== '0') {
              const fourGBands = b4g.toLowerCase().split(/[\+\/]/).map(s => s.trim());
              return !fourGBands.includes('800') && fourGBands.includes('1800') && fourGBands.length === 1;
            }
            return false;
          case '4G_DUAL_BAND':
            if (b4g && b4g.trim() !== '' && b4g !== '0') {
              const fourGBands = b4g.toLowerCase().split(/[\+\/]/).map(s => s.trim());
              return fourGBands.includes('800') && fourGBands.includes('1800');
            }
            return false;
          default: return true;
        }
      });
    }
    return tempSites;
  }, [sites, searchQuery, activeStatFilter]);

  const actions = (
    <>
      {userProfile?.role === 'admin' && (
        <button className="button" onClick={() => navigate('/sites/new')}>+ Add New Site</button>
      )}
      <button className="button" onClick={() => navigate('/export')}>Export</button>
    </>
  );
  
  // Helper function to get style for active stat box
  const getStatBoxStyle = (filterType: StatFilterType) => ({
    cursor: 'pointer',
    border: activeStatFilter === filterType ? '2px solid var(--nt-primary)' : '2px solid transparent',
    boxShadow: activeStatFilter === filterType ? '0 0 8px rgba(0, 86, 179, 0.3)' : 'none',
    transition: 'border 0.2s, boxShadow 0.2s'
  });

  const handleClearFilter = () => {
    setSearchQuery('');
    setActiveStatFilter(null);
  };

  return (
    <PageLayout title="Site Management" actions={actions}>
      <div className="content-card" style={{ padding: '12px', maxHeight: 'auto' /* Allow flexible height */ }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Site Statistics</h2>
        
        {/* Combined General and 4G Stats Row */}
        <div 
          className="content-card-row" 
          style={{ 
            marginBottom: '15px', // Increased margin for separation
            flexWrap: 'wrap',    // Allow wrapping if needed
            gap: '10px'          // Add gap between items
          }}
        >
          <div className="stat-box" style={getStatBoxStyle(null)} onClick={() => handleStatBoxClick(null)} title="Show All Sites">
            <div className="stat-value">{isLoading ? '...' : siteStats.totalSites}</div>
            <div className="stat-label">Total Sites</div>
          </div>
          <div className="stat-box" style={getStatBoxStyle('HAS_2G')} onClick={() => handleStatBoxClick('HAS_2G')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.total2GSites}</div>
            <div className="stat-label">2G Sites</div>
          </div>
          <div className="stat-box" style={getStatBoxStyle('HAS_4G')} onClick={() => handleStatBoxClick('HAS_4G')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.total4GSites}</div>
            <div className="stat-label">4G Sites</div>
          </div>
          <div className="stat-box" style={getStatBoxStyle('2G_ONLY')} onClick={() => handleStatBoxClick('2G_ONLY')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.twoGOnly}</div>
            <div className="stat-label">2G Only</div>
          </div>
        </div>

        {/* 4G Specific Statistics (and 3G Only if moved) */}
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--nt-primary-dark)' }}>4G-Details</h3>
        <div 
          className="content-card-row" 
          style={{ 
            marginBottom: '10px',
            flexWrap: 'wrap', 
            gap: '10px'
          }}
        >
          <div className="stat-box" style={getStatBoxStyle('NO_4G')} onClick={() => handleStatBoxClick('NO_4G')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.noFourG}</div>
            <div className="stat-label">No 4G</div>
          </div>
          <div className="stat-box" style={getStatBoxStyle('4G_800_ONLY')} onClick={() => handleStatBoxClick('4G_800_ONLY')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.fourG800Only}</div>
            <div className="stat-label">800 Only</div>
          </div>
          <div className="stat-box" style={getStatBoxStyle('4G_1800_ONLY')} onClick={() => handleStatBoxClick('4G_1800_ONLY')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.fourG1800Only}</div>
            <div className="stat-label">1800 Only</div>
          </div>
          <div className="stat-box" style={getStatBoxStyle('4G_DUAL_BAND')} onClick={() => handleStatBoxClick('4G_DUAL_BAND')}>
            <div className="stat-value">{isLoading ? '...' : siteStats.fourGDualBand}</div>
            <div className="stat-label">800+1800</div>
          </div>
        </div>
      </div>

      {/* Site Table Section */}
      <div className="content-card">
        <div className="filter-row">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search by SiteID_SiteName or District..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="filter-actions">
            <button className="button">Filter</button>
            <button className="link" onClick={handleClearFilter}>Clear</button>
          </div>
        </div>

        {isLoading && <p>Loading sites...</p>}
        {isError && <p className="error-message" style={{ color: 'red' }}>Error fetching sites: {error?.message}</p>}
        {!isLoading && !isError && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Site Name</th>
                  <th>District</th>
                  <th className="column-site-config">Site (2G/3G/4G)</th>
                  <th>Site & Tower Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.length > 0 ? (
                  filteredSites.map((site: Site) => {
                    const config = site.site_configuration as SiteConfig | null;
                    const band2g = config?.band_2g || '0';
                    const band3g = config?.band_3g || '0';
                    const band4g = config?.band_4g || '0';

                    return (
                      <tr key={site.site_id}>
                        <td>{`${site.site_id}_${site.site_name}`}</td>
                        <td>{site.district || 'N/A'}</td>
                        <td className="column-site-config">
                          {[band2g, band3g, band4g].join(' / ')}
                        </td>
                        <td>
                          {`${site.site_type || 'N/A'} / ${site.tower_type || 'N/A'}`}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="link" onClick={() => navigate(`/sites/${site.site_id}`)}>View</button>
                            <button type="button" className="link" onClick={() => { console.log('Navigating to', `/sites/${site.site_id}/edit`); navigate(`/sites/${site.site_id}/edit`); }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>No sites found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SiteManagement; 