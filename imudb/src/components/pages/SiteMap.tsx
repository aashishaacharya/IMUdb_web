import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngTuple, LatLngBoundsLiteral, Icon } from 'leaflet';
import PageLayout from '../layout/PageLayout';
import 'leaflet/dist/leaflet.css';
import '../../styles/SiteMap.css';
import { Site } from '../../types/site';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

// Simara Airport coordinates
const SIMARA_AIRPORT_CENTER: LatLngTuple = [27.1591, 84.9809];

// Approximate bounds for Bara and Parsa districts
const BARA_PARSA_BOUNDS: LatLngBoundsLiteral = [
  [26.8, 84.5] as LatLngTuple,
  [27.3, 85.2] as LatLngTuple
];

// Fix for default marker icon in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Function to fetch sites for SiteMap
const fetchSitesForSiteMap = async (): Promise<Site[]> => {
  const { data, error } = await supabase
    .from('site')
    .select('site_id, site_name, latitude, longitude, site_type, tower_type'); // Fetch fields needed for popup and Site type
    // Assuming site_type and tower_type are column names in your 'site' table for status and type

  if (error) {
    console.error('Error fetching sites for SiteMap:', error);
    throw new Error(error.message);
  }
  return (data || []).map(item => ({
    id: item.site_id,
    name: item.site_name,
    position: [item.latitude, item.longitude] as [number, number],
    status: item.site_type, // Map to status if site_type is used for status
    type: item.tower_type,   // Map to type if tower_type is used for type
  })) as Site[];
};

interface MapControls {
  sites: {
    visible: boolean;
    selected: string[];
  };
  fiber: {
    visible: boolean;
    selected: string[];
  };
}

interface SiteMapProps {
  // sites prop removed as component will fetch its own data
}

const SiteMap: React.FC<SiteMapProps> = (/*{ sites = [] }*/) => { // sites prop removed
  const {
    data: sites = [],
    isLoading,
    isError,
    error,
  } = useQuery<Site[], Error>({
    queryKey: ['siteMapSites'],
    queryFn: fetchSitesForSiteMap,
    staleTime: 120000,
  });

  const [mapControls, setMapControls] = useState<MapControls>({
    sites: { visible: true, selected: [] },
    fiber: { visible: false, selected: [] }
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState({
    sites: false,
    fiber: false
  });

  const toggleDropdown = (type: keyof typeof isDropdownOpen) => {
    // Close other dropdowns when opening one
    const newState = { sites: false, fiber: false };
    newState[type] = !isDropdownOpen[type];
    setIsDropdownOpen(newState);
  };

  const toggleVisibility = (type: keyof MapControls) => {
    setMapControls(prev => ({
      ...prev,
      [type]: { ...prev[type], visible: !prev[type].visible }
    }));
  };

  const toggleSelection = (type: keyof MapControls, id: string) => {
    setMapControls(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        selected: prev[type].selected.includes(id)
          ? prev[type].selected.filter(item => item !== id)
          : [...prev[type].selected, id]
      }
    }));
  };
  
  // Helper to close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if the click is outside all control groups
      if (!target.closest('.control-group')) {
        setIsDropdownOpen({ sites: false, fiber: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper for dropdown label for Sites
  const getSitesDropdownLabel = () => {
    if (mapControls.sites.selected.length === 0) return 'All Sites';
    if (mapControls.sites.selected.length === 1) {
      const site = sites.find(s => s.id.toString() === mapControls.sites.selected[0]);
      return site ? site.name : 'Site';
    }
    return 'Multiple';
  };

  // Helper for dropdown label for Fiber (placeholder logic, as no fiberRoutes array yet)
  const getFiberDropdownLabel = () => {
    if (mapControls.fiber.selected.length === 0) return 'All Routes';
    if (mapControls.fiber.selected.length === 1) {
      // Replace with actual fiber route name lookup when available
      return 'Route';
    }
    return 'Multiple';
  };

  const mapActions = (
    <div className="map-controls">
      {/* Sites Control Group */}
      <div className="control-group">
        <input
          type="checkbox"
          id="sites-visible-checkbox"
          checked={mapControls.sites.visible}
          onChange={() => toggleVisibility('sites')}
          title={mapControls.sites.visible ? "Hide all sites" : "Show all sites"}
        />
        <label htmlFor="sites-visible-checkbox" className="control-label">Sites</label>
        <button 
          className="dropdown-toggle" 
          onClick={() => toggleDropdown('sites')}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen.sites}
          title="Select specific sites"
        >
          {getSitesDropdownLabel()}
        </button>
        {isDropdownOpen.sites && (
          <div className="dropdown-menu">
            <label className="dropdown-item">
              <input
                type="checkbox"
                checked={mapControls.sites.selected.length === 0} // "All" is checked if no individuals are selected
                onChange={() => setMapControls(prev => ({ ...prev, sites: {...prev.sites, selected: [] } }))}
              />
              All Sites
            </label>
            {sites.map(site => (
              <label key={`site-${site.id}`} className="dropdown-item">
                <input
                  type="checkbox"
                  checked={mapControls.sites.selected.includes(site.id.toString())}
                  onChange={() => toggleSelection('sites', site.id.toString())}
                  disabled={mapControls.sites.selected.length === 0} // Disable if "All Sites" is effectively selected
                />
                {site.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Fiber Routes Control Group */}
      <div className="control-group">
         <input
          type="checkbox"
          id="fiber-visible-checkbox"
          checked={mapControls.fiber.visible}
          onChange={() => toggleVisibility('fiber')}
          title={mapControls.fiber.visible ? "Hide all fiber routes" : "Show all fiber routes"}
        />
        <label htmlFor="fiber-visible-checkbox" className="control-label">Fiber</label>
        <button 
          className="dropdown-toggle"
          onClick={() => toggleDropdown('fiber')}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen.fiber}
          title="Select specific fiber routes"
        >
          {getFiberDropdownLabel()}
        </button>
        {isDropdownOpen.fiber && (
          <div className="dropdown-menu">
            <label className="dropdown-item">
              <input
                type="checkbox"
                checked={mapControls.fiber.selected.length === 0}
                onChange={() => setMapControls(prev => ({ ...prev, fiber: {...prev.fiber, selected: [] } }))}
              />
             All Routes
            </label>
            {/* Add fiber route list here when available */}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout title="Site Map" actions={mapActions}>
      {isLoading && <p>Loading map data...</p>}
      {isError && <p style={{ color: 'red' }}>Error fetching map data: {error?.message}</p>}
      {!isLoading && !isError && (
        <div className="map-page-container">
          <div className="map-container">
            <MapContainer
              center={SIMARA_AIRPORT_CENTER}
              zoom={10}
              minZoom={9}
              maxZoom={19}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {mapControls.sites.visible && sites.map((site) => (
                mapControls.sites.selected.length === 0 || mapControls.sites.selected.includes(site.id.toString()) ? (
                  <Marker
                    key={`marker-${site.id}`}
                    position={site.position as LatLngTuple}
                    icon={DefaultIcon}
                  >
                    <Popup>
                      <strong>{site.name}</strong><br />
                      Status: {site.status || 'N/A'}<br />
                      Type: {site.type || 'N/A'}
                    </Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default SiteMap; 