import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient.ts';
import PageLayout from '../components/layout/PageLayout.tsx';

// Define SiteConfig locally as it's not exported from types/site.ts
interface SiteConfig {
  config_2g: string | null;
  config_3g: string | null;
  config_4g: string | null;
  band_2g: string | null;
  band_3g: string | null;
  band_4g: string | null;
  // Add other config fields if necessary, e.g., config_5g
}

// Define a more complete Site interface, assuming these fields exist in your DB
// Ideally, this should match or extend the one in '../../types/site.ts'
interface SiteDetails {
  site_id: string;
  site_name: string;
  district?: string | null;
  site_type?: string | null;
  tower_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  created_at?: string | null; // Changed from date_added
  updated_at?: string | null; // Changed from last_updated
  tower_height?: number | null; // Added
  building_height?: number | null; // Added
  site_configuration?: SiteConfig | null; // Use the locally defined SiteConfig
}

// Function to fetch detailed information for a single site
const fetchSiteDetails = async (siteId: string): Promise<SiteDetails | null> => {
  const { data, error } = await supabase
    .from('site')
    .select(`
      site_id,
      site_name,
      district,
      site_type,
      tower_type,
      latitude,
      longitude,
      address,
      created_at, 
      updated_at,
      tower_height,
      building_height,
      site_configuration (
        config_2g,
        config_3g,
        config_4g,
        band_2g,
        band_3g,
        band_4g
      )
    `)
    .eq('site_id', siteId)
    .single();

  if (error) {
    console.error('Error fetching site details:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  // Ensure site_configuration is an object or null
  let processedSiteConfig: SiteConfig | null = null;
  if (data.site_configuration) {
    if (Array.isArray(data.site_configuration) && data.site_configuration.length > 0) {
      processedSiteConfig = data.site_configuration[0] as SiteConfig;
    } else if (!Array.isArray(data.site_configuration)) {
      processedSiteConfig = data.site_configuration as SiteConfig; 
    }
  }

  return {
    ...(data as any), // Use 'as any' here carefully, ensure SiteDetails matches DB structure
    site_configuration: processedSiteConfig,
  } as SiteDetails;
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start' }}>
    <strong style={{ width: '150px', flexShrink: 0, marginRight: '10px' }}>{label}:</strong>
    <span>{value}</span>
  </div>
);

const SiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();

  const queryKey = ['siteDetails', siteId];
  const queryFn = () => {
    if (!siteId) return Promise.resolve(null);
    return fetchSiteDetails(siteId);
  };

  const { 
    data: site, 
    isLoading, 
    isError, 
    error 
  } = useQuery<SiteDetails | null, Error>({
    queryKey: queryKey,
    queryFn: queryFn,
    enabled: !!siteId,
  });

  if (isLoading) {
    return <PageLayout title="Loading Site Details..."><p>Loading...</p></PageLayout>;
  }

  if (isError && error) {
    return <PageLayout title="Error"><p className="error-message">Error fetching site details: {error.message}</p></PageLayout>;
  }

  if (!site) {
    return <PageLayout title="Site Not Found"><p>The requested site could not be found.</p></PageLayout>;
  }

  const pageActions = (
    <button 
      className="button" 
      onClick={() => navigate(`/sites/${siteId}/edit`)}
    >
      Edit Site
    </button>
  );

  const towerInfo = [];
  if (site.tower_height) towerInfo.push(`${site.tower_height}m`);
  if (site.tower_type) towerInfo.push(site.tower_type);

  return (
    <PageLayout title={`Site Details: ${site.site_id} - ${site.site_name}`} actions={pageActions}>
      <div className="content-card" style={{ padding: '20px' }}>
        
        <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>General Information</h2>
        <DetailRow label="Site ID" value={site.site_id} />
        <DetailRow label="Site Name" value={site.site_name} />
        <DetailRow label="District" value={site.district || 'N/A'} />
        <DetailRow label="Address" value={site.address || 'N/A'} />
        <DetailRow label="Coordinates" value={`(${site.latitude || 'N/A'}, ${site.longitude || 'N/A'})`} />
        <DetailRow label="Site Type" value={site.site_type || 'N/A'} />
        <DetailRow label="Tower" value={towerInfo.length > 0 ? towerInfo.join(' ') : 'N/A'} />
        <DetailRow label="Building Height" value={site.building_height ? `${site.building_height} meters` : 'N/A'} />
        <DetailRow label="Date Added" value={site.created_at ? new Date(site.created_at).toLocaleDateString() : 'N/A'} />
        <DetailRow label="Last Updated" value={site.updated_at ? new Date(site.updated_at).toLocaleDateString() : 'N/A'} />

        <h2 style={{ fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Site Configuration</h2>
        {site.site_configuration ? (
          <>
            <DetailRow 
              label="2G Config" 
              value={`${site.site_configuration.band_2g || 'N/A'} MHz ${site.site_configuration.config_2g ? `(${site.site_configuration.config_2g})` : ''}`.trim()} 
            />
            <DetailRow 
              label="3G Config" 
              value={`${site.site_configuration.band_3g || 'N/A'} MHz ${site.site_configuration.config_3g ? `(${site.site_configuration.config_3g})` : ''}`.trim()} 
            />
            <DetailRow 
              label="4G Config" 
              value={`${site.site_configuration.band_4g || 'N/A'} MHz ${site.site_configuration.config_4g ? `(${site.site_configuration.config_4g})` : ''}`.trim()} 
            />
          </>
        ) : (
          <p>No configuration details available.</p>
        )}

        <h2 style={{ fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Landowner Information</h2>
        <p><i>Details from 'site_landowner' table - to be implemented.</i></p>

        <h2 style={{ fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>NEA Office Details</h2>
        <p><i>Details from 'site_nea' table - to be implemented.</i></p>

        <h2 style={{ fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Power Details</h2>
        <p><i>Details from 'site_power' table - to be implemented.</i></p>
        
        <h2 style={{ fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Transmission Details</h2>
        <p><i>Details from 'site_transmission' table - to be implemented.</i></p>

        <h2 style={{ fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', color: 'var(--nt-primary-dark)', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Site Image</h2>
        <p><i>Image display area - to be implemented. You would fetch image paths from the 'site_images' table.</i></p>

      </div>
    </PageLayout>
  );
};

export default SiteDetailPage; 