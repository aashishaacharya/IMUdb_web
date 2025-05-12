import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Site } from '../../types/site';

// Birgunj Ghantaghar coordinates
const BIRGUNJ_CENTER = [27.0128, 84.8773] as [number, number];
// Approximate bounds for Bara and Parsa districts
const DISTRICT_BOUNDS = [
  [26.8, 84.5], // Southwest
  [27.3, 85.2]  // Northeast
] as [[number, number], [number, number]];

// Component to set bounds
const SetBounds = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(DISTRICT_BOUNDS);
  }, [map]);
  return null;
};

interface DashboardMapProps {
  sites?: Site[];
}

const DashboardMap: React.FC<DashboardMapProps> = ({ sites = [] }) => {
  return (
    <div className="dashboard-map-container">
      <MapContainer
        center={BIRGUNJ_CENTER}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false} // Hide zoom controls for cleaner look
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Limit the zoom levels to prevent unnecessary tile loading
          minZoom={10}
          maxZoom={16}
        />
        <SetBounds />
        
        {sites.map(site => (
          <Marker 
            key={site.id} 
            position={site.position}
          >
            <Popup>
              <strong>{site.name}</strong>
              {site.status && <div>Status: {site.status}</div>}
              {site.type && <div>Type: {site.type}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DashboardMap; 