import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../contexts/AuthContext';

// Constants for dropdown options
const SITE_TYPE_OPTIONS = ['Indoor', 'Shelter', 'OD_Cabinet', 'Other'];
const TOWER_TYPE_OPTIONS = ['GBT', 'GBP', 'RTT', 'RTP'];
const BOOLEAN_OPTIONS = [{label: 'Select...', value: ''}, {label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}];

// Utility: Deep diff for objects (returns changed fields only)
function getChangedFields(original: any, updated: any) {
  if (!original && !updated) return {};
  if (!original && updated) { // All fields in updated are new
    const changes: Record<string, any> = {};
    for (const key in updated) {
      if (Object.prototype.hasOwnProperty.call(updated, key)) {
        changes[key] = { old: undefined, new: updated[key] };
      }
    }
    return changes;
  }
  // If original exists but updated is null/undefined (e.g. a whole section removed - less common for this form)
  if (original && !updated) { 
    // Depending on desired behavior, could mark all original fields as removed.
    // For now, returning empty as form fields usually persist.
    return {}; 
  }

  const changes: Record<string, any> = {};
  // Check keys in updated against original
  for (const key in updated) {
    if (Object.prototype.hasOwnProperty.call(updated, key)) {
      if (original[key] !== updated[key]) {
        changes[key] = { old: original[key], new: updated[key] };
      }
    }
  }
  // Optional: Check for keys in original but not in updated (fields removed)
  // for (const key in original) {
  //   if (Object.prototype.hasOwnProperty.call(original, key) && !Object.prototype.hasOwnProperty.call(updated, key)) {
  //     changes[key] = { old: original[key], new: undefined }; // Mark as removed
  //   }
  // }
  return changes;
}

// Interfaces for table data structures
interface SiteConfig {
  config_2g: string | null;
  config_3g: string | null;
  config_4g: string | null;
  band_2g: string | null;
  band_3g: string | null;
  band_4g: string | null;
  config_5g?: string | null; // Added from SQL
}

interface SiteLandowner {
  land_owner: string | null;
  land_owner_contact: string | null;
  key_information: string | null;
}

interface SitePower {
  transformer: string | null;
  supply_phase: string | null;
  generator: boolean | null;
  kva_of_dg: number | null;
  nea_subscriber_details: string | null;
  meter_box_mcb_rating: number | null;
  meter_power_rating: number | null;
  power_plant_company: string | null;
  modules_installed: number | null;
  modules_operational: number | null;
  battery_banks: number | null;
  total_battery_capacity: number | null;
  battery_installation_date: string | null; // Date as string
  battery_bank_company: string | null;
  rectifier_capacity: number | null;
  load_current: number | null;
}

interface SiteNea {
  nea_office: string | null;
  nea_office_contact: string | null;
  nea_field_person: string | null;
  nea_field_contact: string | null;
}

interface SiteTransmission {
  transmission_link: string | null;
  transmission_device: string | null;
  transmission_l2: string | null;
  transmission_l3: string | null;
  l3_aggregation: string | null;
  radio_parent: string | null;
  microwave_type: string | null;
  microwave_capacity: number | null;
  microwave_antenna_size: number | null;
}

interface SiteDetails {
  site_id: string;
  site_name: string;
  district?: string | null;
  site_type?: string | null;
  tower_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  tower_height?: number | null;
  building_height?: number | null;
  site_configuration?: SiteConfig | null;
  site_landowner?: SiteLandowner | null;
  site_power?: SitePower | null;
  site_nea?: SiteNea | null;
  site_transmission?: SiteTransmission | null;
}

// Fetch function updated to include related tables
const fetchSiteDetails = async (siteId: string): Promise<SiteDetails | null> => {
  const { data, error } = await supabase
    .from('site')
    .select(`
      *,
      site_configuration(*),
      site_landowner(*),
      site_power(*),
      site_nea(*),
      site_transmission(*)
    `)
    .eq('site_id', siteId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) return null;

  // Helper to process single related records (Supabase returns array for 1-to-1 if not careful)
  const processSingle = (record: any) => 
    Array.isArray(record) && record.length > 0 ? record[0] : (record && !Array.isArray(record) ? record : null);

  return {
    ...data,
    site_configuration: processSingle(data.site_configuration),
    site_landowner: processSingle(data.site_landowner),
    site_power: processSingle(data.site_power),
    site_nea: processSingle(data.site_nea),
    site_transmission: processSingle(data.site_transmission),
  } as SiteDetails;
};

const EditSitePage: React.FC = () => {
  console.log('EditSitePage loaded');
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<SiteDetails>>({});
  const [originalData, setOriginalData] = useState<Partial<SiteDetails>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Destructure data from useQuery result to avoid shadowing
  const { data: queryData, isLoading, isError } = useQuery<SiteDetails | null, Error>({
    queryKey: ['editSite', siteId],
    queryFn: () => siteId ? fetchSiteDetails(siteId) : Promise.resolve(null),
    enabled: !!siteId,
  });

  useEffect(() => {
    if (isLoading) return;
    // Use queryData here
    const fetchedData = !isLoading && queryData ? queryData : {} as SiteDetails;
    
    const initialFormData: Partial<SiteDetails> = {
      site_id: fetchedData.site_id || siteId || '',
      site_name: fetchedData.site_name || '',
      district: fetchedData.district,
      address: fetchedData.address,
      latitude: fetchedData.latitude,
      longitude: fetchedData.longitude,
      site_type: fetchedData.site_type,
      tower_type: fetchedData.tower_type,
      tower_height: fetchedData.tower_height,
      building_height: fetchedData.building_height,
      site_configuration: fetchedData.site_configuration || { config_2g: null, config_3g: null, config_4g: null, band_2g: null, band_3g: null, band_4g: null, config_5g: null },
      site_landowner: fetchedData.site_landowner || { land_owner: null, land_owner_contact: null, key_information: null },
      site_power: fetchedData.site_power || { transformer: null, supply_phase: null, generator: null, kva_of_dg: null, nea_subscriber_details: null, meter_box_mcb_rating: null, meter_power_rating: null, power_plant_company: null, modules_installed: null, modules_operational: null, battery_banks: null, total_battery_capacity: null, battery_installation_date: null, battery_bank_company: null, rectifier_capacity: null, load_current: null },
      site_nea: fetchedData.site_nea || { nea_office: null, nea_office_contact: null, nea_field_person: null, nea_field_contact: null },
      site_transmission: fetchedData.site_transmission || { transmission_link: null, transmission_device: null, transmission_l2: null, transmission_l3: null, l3_aggregation: null, radio_parent: null, microwave_type: null, microwave_capacity: null, microwave_antenna_size: null },
    };
    setFormData(initialFormData);
    setOriginalData(JSON.parse(JSON.stringify(initialFormData)));
  }, [queryData, isLoading, siteId]); // Depend on queryData

  // Generic handler for nested form data
  const handleNestedChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section: keyof SiteDetails,
    isBoolean: boolean = false
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'number') {
      processedValue = value === '' ? null : parseFloat(value);
    } else if (isBoolean) {
      processedValue = value === 'true' ? true : (value === 'false' ? false : null);
    }

    setFormData(prev => {
      if (!prev) return prev;
      const prevSectionData = prev[section] as any;
      return {
        ...prev,
        [section]: {
          ...prevSectionData,
          [name]: processedValue,
        },
      };
    });
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'number') {
      processedValue = value === '' ? null : parseFloat(value);
    }
    setFormData(prev => prev ? { ...prev, [name]: processedValue } : prev);
  };


  const changedFields = useMemo(() => {
    if (!formData || !originalData || Object.keys(originalData).length === 0) return {};
    const allChanges: Record<string, any> = {};

    // Compare main site fields (excluding related table keys)
    const mainSiteOriginal: any = { ...originalData };
    const mainSiteCurrent: any = { ...formData };
    const relatedKeys: (keyof SiteDetails)[] = ['site_configuration', 'site_landowner', 'site_power', 'site_nea', 'site_transmission'];
    
    relatedKeys.forEach(key => {
      delete mainSiteOriginal[key];
      delete mainSiteCurrent[key];
    });

    const siteChanges = getChangedFields(mainSiteOriginal, mainSiteCurrent);
    if (Object.keys(siteChanges).length > 0) allChanges.site = siteChanges;

    // Compare related tables
    relatedKeys.forEach(key => {
      const originalSection = originalData[key] as any;
      const currentSection = formData[key] as any;
      
      // Ensure sections are treated as objects, even if initially null
      const effectiveOriginalSection = originalSection || {};
      const effectiveCurrentSection = currentSection || {};

      // Only compute changes if there's something to compare or if one is present and other is not
      if (originalSection || currentSection) { 
        const sectionChanges = getChangedFields(effectiveOriginalSection, effectiveCurrentSection);
        if (Object.keys(sectionChanges).length > 0) {
           // Ensure the key for the section exists in allChanges before assigning to it
          if (!allChanges[key]) allChanges[key] = {}; 
          allChanges[key] = sectionChanges; 
        }
      }
    });
    return allChanges;
  }, [formData, originalData]);

  const hasChanges = Object.keys(changedFields).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasChanges) {
      alert('No changes detected. Please modify at least one field.');
      return;
    }
    setShowSummary(true);
  };

  const handleConfirm = async () => {
    if (!siteId || !formData) return;
    setSubmitting(true);
    setError(null);
    try {
      const proposed_changes = { ...changedFields }; 
      if (comment.trim()) {
        proposed_changes.comment = comment.trim();
      }

      const insertPayload = {
        target_table: 'site',
        target_record_id: siteId,
        site_name: formData.site_name || null,
        proposed_changes,
        status: 'pending',
        requested_by_user_id: userProfile?.user_id || null,
      };

      const { error: insertError } = await supabase
        .from('pending_edits')
        .insert([insertPayload]);

      if (insertError) throw insertError;
      setSubmitting(false);
      navigate('/pending-edits');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  if (isLoading || Object.keys(formData).length === 0 && siteId) {
    return <PageLayout title="Edit Site"><p>Loading site details...</p></PageLayout>;
  }
  if (isError) {
    return <PageLayout title="Edit Site"><p style={{ color: 'red' }}>Error loading site data.</p></PageLayout>;
  }
  if (!siteId) {
    return <PageLayout title="Edit Site"><p>No Site ID provided.</p></PageLayout>;
  }
  
  // Helper to render input fields for a section
  const renderSectionFields = (sectionName: keyof SiteDetails, sectionTitle: string, fieldsConfig: Array<{name: string, label: string, type?: string, options?: any[]}>) => {
    const sectionData = formData[sectionName] as any || {};
    return (
      <>
        <h2 style={{ fontSize: '1.1rem', margin: '20px 0 10px' }}>{sectionTitle}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom:'10px' }}>
          {fieldsConfig.map(field => (
            <div key={field.name} style={{ flex: 1, minWidth: '250px' }}>
              <label>{field.label}</label>
              {field.type === 'select' ? (
                <select 
                  name={field.name} 
                  value={sectionData[field.name] === true ? 'true' : sectionData[field.name] === false ? 'false' : sectionData[field.name] || ''} 
                  onChange={(e) => handleNestedChange(e, sectionName, field.options === BOOLEAN_OPTIONS)}
                  className="form-control"
                >
                  {field.options?.map(opt => <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea 
                  name={field.name} 
                  value={sectionData[field.name] || ''} 
                  onChange={(e) => handleNestedChange(e, sectionName)}
                  className="form-control" 
                  rows={2}
                />
              ) : (
                <input 
                  type={field.type || 'text'} 
                  name={field.name} 
                  value={sectionData[field.name] ?? ''} 
                  onChange={(e) => handleNestedChange(e, sectionName)}
                  className="form-control" 
                  step={field.type === 'number' ? 'any' : undefined}
                />
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <PageLayout title={`Edit Site: ${formData.site_id || siteId} - ${formData.site_name || ''}`}>
      <div className="content-card" style={{ maxWidth: '900px', margin: '20px auto', padding: '30px' }}>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message" style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{error}</p>}

          <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Site Information</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom:'10px' }}>
            {/* Main site fields - using direct formData access and handleChange */}
            <div style={{ flex: 1, minWidth: '250px' }}><label>Site Name</label><input type="text" name="site_name" value={formData.site_name || ''} onChange={handleChange} className="form-control" /></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>District</label><input type="text" name="district" value={formData.district || ''} onChange={handleChange} className="form-control" /></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Address</label><textarea name="address" value={formData.address || ''} onChange={handleChange} className="form-control" rows={2}/></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Latitude</label><input type="number" step="any" name="latitude" value={formData.latitude ?? ''} onChange={handleChange} className="form-control" /></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Longitude</label><input type="number" step="any" name="longitude" value={formData.longitude ?? ''} onChange={handleChange} className="form-control" /></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Site Type</label><select name="site_type" value={formData.site_type || ''} onChange={handleChange} className="form-control"><option value="">Select...</option>{SITE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Tower Type</label><select name="tower_type" value={formData.tower_type || ''} onChange={handleChange} className="form-control"><option value="">Select...</option>{TOWER_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Tower Height (m)</label><input type="number" step="any" name="tower_height" value={formData.tower_height ?? ''} onChange={handleChange} className="form-control" /></div>
            <div style={{ flex: 1, minWidth: '250px' }}><label>Building Height (m)</label><input type="number" step="any" name="building_height" value={formData.building_height ?? ''} onChange={handleChange} className="form-control" /></div>
          </div>
          
          {renderSectionFields('site_configuration', 'Site Configuration', [
            {name: 'band_2g', label: '2G Band'}, {name: 'config_2g', label: '2G Config'},
            {name: 'band_3g', label: '3G Band'}, {name: 'config_3g', label: '3G Config'},
            {name: 'band_4g', label: '4G Band'}, {name: 'config_4g', label: '4G Config'},
            {name: 'config_5g', label: '5G Config'},
          ])}

          {renderSectionFields('site_landowner', 'Landowner Information', [
            {name: 'land_owner', label: 'Land Owner Name'},
            {name: 'land_owner_contact', label: 'Land Owner Contact'},
            {name: 'key_information', label: 'Key Information'},
          ])}

          {renderSectionFields('site_power', 'Power Details', [
            {name: 'transformer', label: 'Transformer'}, {name: 'supply_phase', label: 'Supply Phase'},
            {name: 'generator', label: 'Generator', type:'select', options: BOOLEAN_OPTIONS},
            {name: 'kva_of_dg', label: 'KVA of DG', type:'number'},
            {name: 'nea_subscriber_details', label: 'NEA Subscriber Details'},
            {name: 'meter_box_mcb_rating', label: 'Meter Box MCB Rating', type:'number'},
            {name: 'meter_power_rating', label: 'Meter Power Rating', type:'number'},
            {name: 'power_plant_company', label: 'Power Plant Company'},
            {name: 'modules_installed', label: 'Modules Installed', type:'number'},
            {name: 'modules_operational', label: 'Modules Operational', type:'number'},
            {name: 'battery_banks', label: 'Battery Banks', type:'number'},
            {name: 'total_battery_capacity', label: 'Total Battery Capacity', type:'number'},
            {name: 'battery_installation_date', label: 'Battery Installation Date', type:'date'},
            {name: 'battery_bank_company', label: 'Battery Bank Company'},
            {name: 'rectifier_capacity', label: 'Rectifier Capacity', type:'number'},
            {name: 'load_current', label: 'Load Current', type:'number'},
          ])}
          
          {renderSectionFields('site_nea', 'NEA Office Details', [
            {name: 'nea_office', label: 'NEA Office'},
            {name: 'nea_office_contact', label: 'NEA Office Contact'},
            {name: 'nea_field_person', label: 'NEA Field Person'},
            {name: 'nea_field_contact', label: 'NEA Field Contact'},
          ])}

          {renderSectionFields('site_transmission', 'Transmission Details', [
            {name: 'transmission_link', label: 'Transmission Link'},
            {name: 'transmission_device', label: 'Transmission Device'},
            {name: 'transmission_l2', label: 'Transmission L2'},
            {name: 'transmission_l3', label: 'Transmission L3'},
            {name: 'l3_aggregation', label: 'L3 Aggregation'},
            {name: 'radio_parent', label: 'Radio Parent'},
            {name: 'microwave_type', label: 'Microwave Type'},
            {name: 'microwave_capacity', label: 'Microwave Capacity', type:'number'},
            {name: 'microwave_antenna_size', label: 'Microwave Antenna Size', type:'number'},
          ])}

          <div style={{ margin: '20px 0' }}>
            <label>Comment for Edit (optional)</label>
            <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Reason for changes..." />
          </div>

          {showSummary && hasChanges && (
            <div style={{ background: '#f0f8ff', border: '1px solid #add8e6', borderRadius: '6px', padding: '20px', margin: '20px 0' }}>
              <h3 style={{ color: '#0056b3', marginBottom: '15px', borderBottom:'1px solid #ddd', paddingBottom:'10px' }}>Confirm Your Changes</h3>
              {Object.entries(changedFields).map(([sectionKey, sectionFieldChanges]) => {
                // Ensure sectionFieldChanges is treated as an object
                const changesToDisplay = typeof sectionFieldChanges === 'object' && sectionFieldChanges !== null ? sectionFieldChanges : {};
                return (
                  <div key={sectionKey} style={{marginBottom:'10px'}}>
                    <h4 style={{color: '#003d7f', textTransform:'capitalize'}}>{sectionKey.replace(/_/g, ' ')}</h4>
                    <ul style={{ listStyleType: 'disc', marginLeft: '25px'}}>
                      {Object.entries(changesToDisplay).map(([fieldKey, changeDetail]) => {
                        const { old: oldValue, new: newValue } = changeDetail as { old: any; new: any };
                        return (
                          <li key={fieldKey}>
                            <strong>{fieldKey.replace(/_/g, ' ')}:</strong> 
                            <span style={{ color: '#dc3545', textDecoration:'line-through' }}>{String(oldValue ?? 'empty')}</span> &rarr; 
                            <span style={{ color: '#28a745' }}>{String(newValue ?? 'empty')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" className="button" onClick={handleConfirm} disabled={submitting}>{submitting ? 'Submitting...' : 'Confirm & Submit Edit'}</button>
                <button type="button" className="button" style={{ background: '#6c757d' }} onClick={() => setShowSummary(false)}>Back to Edit</button>
              </div>
            </div>
          )}

          {!showSummary && (
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="button" onClick={() => navigate('/sites')} style={{backgroundColor: '#6c757d'}}>Cancel</button>
              <button type="submit" className="button" disabled={submitting || isLoading}>{submitting ? 'Checking...' : (isLoading ? 'Loading Data...' : 'Review & Suggest Edit')}</button>
            </div>
          )}
        </form>
      </div>
    </PageLayout>
  );
};

export default EditSitePage; 