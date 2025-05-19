import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PageLayout from '../components/layout/PageLayout';
import '../styles/PageLayout.css'; // For .content-card, .form-group, .form-control, .button styles

interface SiteFormData {
  site_id: string;
  site_name: string;
  district: string;
  address: string;
  latitude: number | string; // Allow string for input, convert to number on submit
  longitude: number | string;
  site_type: string;
  tower_type: string;
  tower_height: number | string;
  building_height: number | string;
}

const ADD_SITE_FORM_DATA_KEY = 'addSiteFormData';

const SITE_TYPE_OPTIONS = ['Indoor', 'Shelter', 'OD_Cabinet', 'Other'];
const TOWER_TYPE_OPTIONS = ['GBT', 'GBP', 'RTT', 'RTP'];

const AddSitePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SiteFormData>(() => {
    const savedData = localStorage.getItem(ADD_SITE_FORM_DATA_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
        localStorage.removeItem(ADD_SITE_FORM_DATA_KEY); // Clear corrupted data
        return {
          site_id: '', site_name: '', district: '', address: '',
          latitude: '', longitude: '', site_type: '', tower_type: '',
          tower_height: '', building_height: '',
        };
      }
    }
    return {
      site_id: '', site_name: '', district: '', address: '',
      latitude: '', longitude: '', site_type: '', tower_type: '',
      tower_height: '', building_height: '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save to localStorage on every formData change
  useEffect(() => {
    localStorage.setItem(ADD_SITE_FORM_DATA_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { latitude, longitude, tower_height, building_height, ...rest } = formData;

    const siteDataToInsert = {
      ...rest,
      latitude: latitude !== '' ? parseFloat(latitude as string) : null,
      longitude: longitude !== '' ? parseFloat(longitude as string) : null,
      tower_height: tower_height !== '' ? parseFloat(tower_height as string) : null,
      building_height: building_height !== '' ? parseFloat(building_height as string) : null,
      // created_by will be set by RLS/Supabase trigger if auth.uid() is available
    };

    try {
      const { error: insertError } = await supabase
        .from('site')
        .insert([siteDataToInsert]);

      if (insertError) {
        console.error('Error inserting site:', insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      localStorage.removeItem(ADD_SITE_FORM_DATA_KEY); // Clear on successful submit
      navigate('/sites'); // Redirect to site management page after successful insert
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem(ADD_SITE_FORM_DATA_KEY); // Clear on cancel
    navigate('/sites');
  };

  const formRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  };

  const labelStyle: React.CSSProperties = {
    width: '180px', // Increased label width
    marginRight: '10px',
    textAlign: 'left',
    flexShrink: 0,
  };

  const inputStyle: React.CSSProperties = {
    flexGrow: 1,
    minWidth: '250px', // Minimum width for input
    marginRight: '10px', // Added right margin for input fields
  };

  return (
    <PageLayout title="Add New Site">
      <div className="content-card" style={{ maxWidth: '800px', margin: '20px auto', padding: '30px' }}> {/* Increased maxWidth and padding */}
        {/* Clear Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
          <button
            type="button"
            className="button"
            style={{ backgroundColor: '#6c757d' }}
            onClick={() => {
              setFormData({
                site_id: '', site_name: '', district: '', address: '',
                latitude: '', longitude: '', site_type: '', tower_type: '',
                tower_height: '', building_height: '',
              });
              localStorage.removeItem(ADD_SITE_FORM_DATA_KEY);
            }}
          >
            Clear
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message" style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{error}</p>}
          
          <div style={formRowStyle}>
            <label htmlFor="site_id" style={labelStyle}>Site ID *</label>
            <input type="text" id="site_id" name="site_id" value={formData.site_id} onChange={handleChange} required className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="site_name" style={labelStyle}>Site Name *</label>
            <input type="text" id="site_name" name="site_name" value={formData.site_name} onChange={handleChange} required className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="district" style={labelStyle}>District</label>
            <input type="text" id="district" name="district" value={formData.district} onChange={handleChange} className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="address" style={labelStyle}>Address *</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="latitude" style={labelStyle}>Latitude</label>
            <input type="number" step="any" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="longitude" style={labelStyle}>Longitude</label>
            <input type="number" step="any" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="site_type" style={labelStyle}>Site Type</label>
            <select id="site_type" name="site_type" value={formData.site_type} onChange={handleChange} className="form-control" style={inputStyle}>
              <option value="">Select Site Type</option>
              {SITE_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={formRowStyle}>
            <label htmlFor="tower_type" style={labelStyle}>Tower Type</label>
            <select id="tower_type" name="tower_type" value={formData.tower_type} onChange={handleChange} className="form-control" style={inputStyle}>
              <option value="">Select Tower Type</option>
              {TOWER_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={formRowStyle}>
            <label htmlFor="tower_height" style={labelStyle}>Tower Height (m)</label>
            <input type="number" step="any" id="tower_height" name="tower_height" value={formData.tower_height} onChange={handleChange} className="form-control" style={inputStyle} />
          </div>
          <div style={formRowStyle}>
            <label htmlFor="building_height" style={labelStyle}>Building Height (m)</label>
            <input type="number" step="any" id="building_height" name="building_height" value={formData.building_height} onChange={handleChange} className="form-control" style={inputStyle} />
          </div>
          
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="button" onClick={handleCancel} style={{ backgroundColor: '#6c757d' }}> {/* Grey cancel button */}
              Cancel
            </button>
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Site'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default AddSitePage; 