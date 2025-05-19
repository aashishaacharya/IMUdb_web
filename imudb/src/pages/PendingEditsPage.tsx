import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../contexts/AuthContext';

export interface ProposedChanges {
  // This will vary, so we use a generic record
  // Specific known structures can be added like:
  // site?: Record<string, any>;
  // site_configuration?: Record<string, any>;
  // site_power?: Record<string, any>;
  [key: string]: any; // Allows any structure within proposed_changes
  comment?: string; 
}

export interface PendingEdit {
  id: string; // edit_id is uuid
  target_table: string;
  target_record_id: string;
  proposed_changes: ProposedChanges;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  requested_by_user_id: string;
  requested_at: string;
  reviewed_by_user_id?: string | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  // For displaying user info
  requested_by_email?: string;
  requested_by_name?: string;
  reviewed_by_email?: string;
  reviewed_by_name?: string;
  site_name?: string;
}

// Function to fetch user profile data including name if available
const fetchUserProfileData = async (userId: string | null): Promise<{ email: string | null; name: string | null }> => {
  if (!userId) return { email: null, name: null };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email, name') // Select name field as in the schema
      .eq('id', userId) // user_id is referenced as id in your schema
      .single();
      
    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return { email: 'Error fetching email', name: null };
    }
    
    return { 
      email: data?.email || 'Unknown User', 
      name: data?.name || null  // Map from name field
    };
  } catch (e) {
    console.error(`Exception fetching profile for user ${userId}:`, e);
    return { email: 'Exception fetching email', name: null };
  }
};

// Helper to get first name from full name or abbreviated display
const getFirstNameOrInitial = (name: string | null | undefined, email: string | null | undefined): string => {
  if (name) {
    // Get first word/name from name
    const firstName = name.split(' ')[0];
    return firstName;
  }
  
  // Handle cases where email might be an error message or placeholder from fetchUserProfileData
  if (email && email.toLowerCase().includes('error') || email === 'Unknown User') {
    return 'Unknown'; // Or a more specific placeholder like "User Data Unavailable"
  }

  if (email) {
    // Try to extract username from email
    const username = email.split('@')[0];
    // If username contains dots or underscores, split and take first part
    if (username.includes('.')) return username.split('.')[0];
    if (username.includes('_')) return username.split('_')[0];
    // Capitalize the extracted username part for better display
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  return 'Unknown';
};

const fetchPendingEdits = async (): Promise<PendingEdit[]> => {
  const { data, error } = await supabase
    .from('pending_edits')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending edits:', error);
    throw new Error(error.message);
  }

  // Fetch user info for both requesters and reviewers
  const editsWithUserInfo = await Promise.all(
    (data || []).map(async (edit) => {
      const [requesterInfo, reviewerInfo] = await Promise.all([
        fetchUserProfileData(edit.requested_by_user_id),
        edit.reviewed_by_user_id ? fetchUserProfileData(edit.reviewed_by_user_id) : Promise.resolve({ email: null, name: null })
      ]);
      
      return { 
        ...edit, 
        requested_by_email: requesterInfo.email,
        requested_by_name: requesterInfo.name,
        reviewed_by_email: reviewerInfo.email,
        reviewed_by_name: reviewerInfo.name
      };
    })
  );
  
  return editsWithUserInfo as PendingEdit[];
};

// Helper to create a concise summary of changes
const createChangeSummary = (changes: ProposedChanges): string => {
  const changedSections = Object.keys(changes).filter(key => key !== 'comment');
  if (changedSections.length === 0) return 'No changes listed.';
  
  // Count total number of changed fields
  let totalFieldsChanged = 0;
  changedSections.forEach(sectionKey => {
    if (typeof changes[sectionKey] === 'object' && changes[sectionKey] !== null) {
      totalFieldsChanged += Object.keys(changes[sectionKey]).length;
    }
  });

  if (totalFieldsChanged === 0 && changes.comment) return "Comment added.";
  if (totalFieldsChanged === 0) return "No specific field changes found.";

  const summary = changedSections.map(section => 
    `${section.replace(/_/g, ' ')} (${Object.keys(changes[section]).length} fields)`
  ).join(', ');
  
  return summary || 'Details in view.';
};

// Helper to format field names (e.g., site_name to Site Name)
const formatFieldName = (fieldName: string) => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Component for expanded edit details
const ExpandedEditDetails: React.FC<{ 
  edit: PendingEdit; 
  onClose: () => void;
  onAction?: (editId: string, action: 'approved' | 'rejected' | 'deleted', comment: string) => void;
}> = ({ edit, onClose, onAction }) => {
  const [reviewComment, setReviewComment] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { userProfile } = useAuth();
  
  const toggleSectionExpand = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const { proposed_changes, status, target_record_id, requested_by_name, requested_by_email,
          reviewed_by_user_id, reviewed_by_name, reviewed_by_email, reviewed_at, review_comments } = edit;

  const changeSections = Object.keys(proposed_changes).filter(key => key !== 'comment');

  const handleAction = (actionStatus: 'approved' | 'rejected' | 'deleted') => {
    if (actionStatus === 'rejected' && !reviewComment.trim()) {
      alert('Please provide a comment when rejecting an edit.');
      return;
    }
    if (onAction) {
      onAction(edit.id, actionStatus, reviewComment);
    }
  };

  const requestedByDisplay = requested_by_name || getFirstNameOrInitial(undefined, requested_by_email);

  return (
    <div style={{ padding: '10px', backgroundColor: '#fdfdfd', borderTop: '1px solid #e0e0e0' }}>
      {/* Compact Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.85rem' }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>Site ID:</span> {target_record_id} | 
          <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>By:</span> {requestedByDisplay} | 
          <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>Status:</span> 
          <span className={`status-badge ${
            status === 'pending' ? 'maintenance' : 
            status === 'approved' ? 'active' : 
            status === 'rejected' ? 'inactive' : 'error'
          }`} style={{fontSize: '0.8rem', padding: '2px 5px', marginLeft:'3px'}}>
            {status}
          </span>
        </div>
        {/* Minimal close button or rely on row click to collapse */}
         <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#aaa', padding: '0 5px' }}
          title="Close details"
        >
          &times;
        </button>
      </div>

      {reviewed_by_user_id && (
        <div style={{ fontSize: '0.8rem', marginBottom: '5px', color: '#555' }}>
          Reviewed by {reviewed_by_name || reviewed_by_email || 'Unknown'} 
          {reviewed_at && status !== 'pending' ? ` on ${new Date(reviewed_at).toLocaleDateString()}` : ''}.
          {review_comments && ` Comment: ${review_comments}`}
        </div>
      )}

      {/* Direct Changes Display */}
      {changeSections.length === 0 && !proposed_changes.comment ? (
        <p style={{fontSize: '0.9rem', margin: '5px 0'}}>No changes to review.</p>
      ) : (
        changeSections.map((sectionKey) => {
          const isExpanded = !!expandedSections[sectionKey];
          const fieldChanges = proposed_changes[sectionKey] as Record<string, { old: any; new: any }>;
          if (!fieldChanges || typeof fieldChanges !== 'object') return null;
          const fieldCount = Object.keys(fieldChanges).length;
          if (fieldCount === 0) return null;
          
          return (
            <div key={sectionKey} style={{ marginBottom: '10px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
              <div 
                onClick={() => toggleSectionExpand(sectionKey)}
                style={{ 
                  padding: '6px 8px',
                  background: '#f5f7f9',
                  borderBottom: isExpanded ? '1px solid #ddd' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h5 style={{ textTransform: 'capitalize', margin: 0, fontSize: '0.9rem', fontWeight: '600', color: 'var(--nt-primary-dark)' }}>
                  {formatFieldName(sectionKey)} ({fieldCount})
                </h5>
                <span style={{ fontSize: '1rem', color: '#555' }}>{isExpanded ? '▼' : '▶'}</span>
              </div>
              
              {isExpanded && (
                <div style={{ padding: '8px' }}>
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                    {Object.entries(fieldChanges).map(([fieldKey, changeDetail]) => (
                      <li key={fieldKey} style={{ padding: '4px 0', borderBottom: '1px dashed #eee' }}>
                        <strong style={{color: '#333'}}>{formatFieldName(fieldKey)}:</strong> 
                        <span style={{ color: '#c00', textDecoration: 'line-through', marginLeft:'5px', marginRight:'5px' }}>
                          {String(changeDetail.old ?? 'N/A')}
                        </span> &rarr; 
                        <span style={{ color: '#006400', marginLeft:'5px' }}>
                          {String(changeDetail.new ?? 'N/A')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })
      )}

      {proposed_changes.comment && (
        <div style={{ marginTop: '10px', background: '#f0f2f5', padding: '8px 10px', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.9rem' }}>
          <strong style={{color: 'var(--nt-primary-dark)'}}>Comment:</strong> 
          <span style={{ marginLeft: '5px', whiteSpace: 'pre-wrap', color: '#444' }}>{proposed_changes.comment}</span>
        </div>
      )}

      {/* Compact Action Area */}
      {status === 'pending' && (userProfile?.role === 'admin' || userProfile?.role === 'editor') && onAction && (
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <textarea 
              className="form-control"
              rows={1} 
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Any comment for review..."
              style={{fontSize: '0.9rem', flexGrow: 1, padding: '6px 8px', minHeight:'34px'}}
            />
            <div style={{display: 'flex', gap: '5px'}}>
              <button 
                onClick={() => handleAction('approved')} 
                className="button" 
                style={{backgroundColor: '#28a745', padding: '6px 10px', fontSize: '0.85rem'}} 
              >
                Approve
              </button>
              <button 
                onClick={() => handleAction('rejected')} 
                className="button" 
                style={{backgroundColor: '#ffc107', color: '#333', padding: '6px 10px', fontSize: '0.85rem'}} 
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      
      {status === 'pending' && (userProfile?.user_id === edit.requested_by_user_id || userProfile?.role === 'admin') && onAction && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: status === 'pending' && (userProfile?.role === 'admin' || userProfile?.role === 'editor') ? 'none':'1px dashed #ccc', textAlign:'right'}}>
          <button 
            onClick={() => {
              if(window.confirm('Are you sure you want to delete this pending edit?')) {
                handleAction('deleted');
              }
            }} 
            className="button"
            style={{backgroundColor: '#dc3545', padding: '6px 10px', fontSize: '0.85rem'}} 
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Helper for displaying detail rows
const DetailRow: React.FC<{ 
  label: string; 
  value: React.ReactNode;
  fullWidth?: boolean;
}> = ({ label, value, fullWidth = false }) => (
  <div style={{ 
    gridColumn: fullWidth ? '1 / -1' : 'auto', // Span all columns if fullWidth
    padding: '6px 0', 
    borderBottom: '1px solid #f0f0f0' 
  }}>
    <strong style={{ color: '#555', display: 'block', marginBottom: '3px', fontSize: '0.85rem' }}>{label}:</strong>
    <div style={{ wordBreak: 'break-word', fontSize: '0.95rem', color: '#333' }}>{value}</div>
  </div>
);

const PendingEditsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deleted'>('pending'); 
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  
  const { 
    data: edits = [], 
    isLoading, 
    isError, 
    error,
  } = useQuery<PendingEdit[], Error>({
    queryKey: ['pendingEdits', filterStatus], // Add filterStatus to queryKey to refetch on filter change
    queryFn: fetchPendingEdits, // Consider if fetchPendingEdits should take filterStatus
  });

  const updateEditStatusMutation = useMutation({
    mutationFn: async ({ 
      editId, 
      status, 
      comment 
    }: { 
      editId: string; 
      status: 'approved' | 'rejected' | 'deleted'; 
      comment?: string 
    }) => { 
      if (!editId) throw new Error('Edit ID is missing');

      if (status === 'approved') {
        const { data, error: functionError } = await supabase.functions.invoke('apply-pending-edit', {
          body: { edit_id: editId, review_comment: comment }
        });
        if (functionError) throw functionError;
        return data;
      } else {
        const updatePayload: any = {
          status,
          reviewed_by_user_id: userProfile?.user_id,
          reviewed_at: new Date().toISOString(),
        };
        if (comment) updatePayload.review_comments = comment;

        const { error: updateError } = await supabase
          .from('pending_edits')
          .update(updatePayload)
          .eq('id', editId);
        if (updateError) throw updateError;
        return { success: true }; 
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingEdits', filterStatus] });
      setExpandedEditId(null); // Close the expanded row
    },
    onError: (err: Error) => {
      alert(`Error updating edit: ${err.message}`);
    },
  });

  const handleAction = (editId: string, action: 'approved' | 'rejected' | 'deleted', comment: string) => {
    if (action === 'rejected' && !comment.trim()) {
      alert('Please provide a comment when rejecting an edit.');
      return;
    }
    updateEditStatusMutation.mutate({ editId, status: action, comment });
  };

  const handleCommentChange = (editId: string, comment: string) => {
    setReviewComments(prev => ({
      ...prev,
      [editId]: comment
    }));
  };

  const filteredEdits = edits.filter(edit => {
    if (filterStatus === 'all') return true;
    return edit.status === filterStatus;
  });

  const toggleExpandEdit = (editId: string) => {
    setExpandedEditId(currentId => (currentId === editId ? null : editId));
  };

  const filterButtons = (
    <div className="filter-actions" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      {(['pending', 'approved', 'rejected', 'all'] as const).map(statusVal => (
        <button 
          key={statusVal}
          onClick={() => {
            setFilterStatus(statusVal);
            setExpandedEditId(null); // Close any open detail view when changing filter
          }}
          className={`button ${filterStatus === statusVal ? 'active' : ''}`}
          style={filterStatus === statusVal ? {background: 'var(--nt-primary)', color: 'white'} : {background: '#e9ecef'}}
        >
          {statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <PageLayout title="Pending Edits" actions={filterButtons}>
      <div className="content-card">
        {isLoading && <p>Loading pending edits...</p>}
        {isError && <p className="error-message" style={{ color: 'red' }}>Error fetching edits: {error?.message}</p>}
        {!isLoading && !isError && filteredEdits.length === 0 && <p>No {filterStatus !== 'all' ? filterStatus : ''} edits found.</p>}
        {!isLoading && !isError && filteredEdits.length > 0 && (
          <div className="table-responsive" style={{ width: '100%', minWidth: '850px', padding: '0 4px' }}>
            <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{width: '30%', minWidth: '150px', padding: '8px 4px'}}>Site ID</th>
                  <th style={{width: '40%', minWidth: '200px', padding: '8px 4px'}}>Summary of Changes</th>
                  <th style={{width: '15%', minWidth: '90px', padding: '8px 4px'}}>Requested By</th>
                  <th style={{width: '15%', minWidth: '70px', padding: '8px 4px'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEdits.map((edit) => (
                  <React.Fragment key={edit.id}>
                    <tr style={{cursor: 'pointer'}} onClick={() => toggleExpandEdit(edit.id)}>
                      <td style={{padding: '4px', width: '30%'}}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            display: 'inline-flex', // Use flex to center arrow character
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',         // Slightly larger arrow for better visual balance
                            color: 'var(--nt-primary)', 
                            transition: 'transform 0.2s', 
                            transform: expandedEditId === edit.id ? 'rotate(90deg)' : 'rotate(0deg)',
                            minWidth: '1em',          // Ensure space for the arrow character
                            marginRight: '16px'       // Increased space: 8px existing + 8px more
                          }}>
                            ▶
                          </span>
                          <div>
                            <div>{edit.target_record_id}</div>
                            {edit.site_name && (
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>{edit.site_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ 
                        whiteSpace: 'normal', 
                        wordBreak: 'break-word', 
                        padding: '4px', 
                        width: '40%',
                        textAlign: 'center'
                      }}>
                        {createChangeSummary(edit.proposed_changes)}
                      </td>
                      <td style={{padding: '4px', width: '15%', textAlign: 'center'}}>
                        {getFirstNameOrInitial(edit.requested_by_name, edit.requested_by_email)}
                      </td>
                      <td style={{padding: '4px', width: '15%', textAlign: 'center'}}>
                        <span className={`status-badge ${
                          edit.status === 'pending' ? 'maintenance' : 
                          edit.status === 'approved' ? 'active' : 
                          edit.status === 'rejected' ? 'inactive' : 
                          edit.status === 'deleted' ? 'error' : ''
                        }`}>
                          {edit.status}
                        </span>
                      </td>
                    </tr>
                    {expandedEditId === edit.id && (
                      <tr>
                        <td colSpan={4} style={{ padding: '0' }}>
                          <div style={{ padding: '8px', borderTop: '1px solid #eee', background: '#fafafa' }}>
                            {/* Compact header with basic info */}
                            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 'bold' }}>Site:</span> {edit.target_record_id} 
                              {edit.site_name && ` - ${edit.site_name}`} | 
                              <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>By:</span> {getFirstNameOrInitial(edit.requested_by_name, edit.requested_by_email)} | 
                              <span className={`status-badge ${edit.status === 'pending' ? 'maintenance' : edit.status === 'approved' ? 'active' : 'inactive'}`} 
                                    style={{ fontSize: '0.8rem', padding: '2px 6px', marginLeft: '8px' }}>
                                {edit.status}
                              </span>
                            </div>

                            {/* Direct display of changes */}
                            {Object.entries(edit.proposed_changes)
                              .filter(([key]) => key !== 'comment')
                              .map(([tableName, changes]) => {
                                const changeEntries = Object.entries(changes as Record<string, { old: any; new: any }>);
                                if (changeEntries.length === 0) return null;

                                // Simplify table name by removing 'site_' prefix
                                const displayTableName = tableName.replace('site_', '');

                                return (
                                  <div key={tableName} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>
                                    {changeEntries.map(([field, { old, new: newValue }], index) => (
                                      <div key={field} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        marginBottom: '2px',
                                        marginLeft: index === 0 ? '0' : '100px' // Adjusted indent for subsequent lines if table name is present
                                      }}>
                                        {index === 0 && (
                                          <span style={{ 
                                            width: '100px', // Increased width for table name
                                            fontWeight: '600', 
                                            color: '#444',
                                            marginRight: '8px',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {displayTableName}:
                                          </span>
                                        )}
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ color: '#666', marginRight: '12px' }}>{formatFieldName(field)}:</span> {/* Added marginRight for 2-3 spaces */} 
                                          <span style={{ color: '#d32f2f', textDecoration: 'line-through' }}>{String(old ?? 'N/A')}</span>
                                          <span style={{ margin: '0 4px' }}>→</span>
                                          <span style={{ color: '#2e7d32' }}>{String(newValue ?? 'N/A')}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}

                            {/* Comment and actions section */}
                            {edit.status === 'pending' && (userProfile?.role === 'admin' || userProfile?.role === 'editor') && (
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginTop: '8px', 
                                alignItems: 'center'
                              }}>
                                <input
                                  type="text"
                                  value={reviewComments[edit.id] || ''}
                                  onChange={(e) => handleCommentChange(edit.id, e.target.value)}
                                  placeholder="Any comment..."
                                  style={{
                                    flex: '1',
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    height: '28px',
                                    maxWidth: '400px'  // Added max width
                                  }}
                                />
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '4px',
                                  flexShrink: 0 // Prevent buttons from shrinking
                                }}>
                                  <button 
                                    onClick={() => handleAction(edit.id, 'approved', reviewComments[edit.id] || '')} 
                                    style={{ 
                                      padding: '4px 8px', 
                                      background: '#4caf50', 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '4px', 
                                      cursor: 'pointer', 
                                      fontSize: '0.9rem',
                                      whiteSpace: 'nowrap'
                                    }}>
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleAction(edit.id, 'rejected', reviewComments[edit.id] || '')}
                                    style={{ 
                                      padding: '4px 8px', 
                                      background: '#ff9800', 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '4px', 
                                      cursor: 'pointer', 
                                      fontSize: '0.9rem',
                                      whiteSpace: 'nowrap'
                                    }}>
                                    Reject
                                  </button>
                                  {(userProfile?.user_id === edit.requested_by_user_id || userProfile?.role === 'admin') && (
                                    <button 
                                      onClick={() => {
                                        if(window.confirm('Are you sure you want to delete this pending edit?')) {
                                          handleAction(edit.id, 'deleted', reviewComments[edit.id] || '');
                                        }
                                      }}
                                      style={{ 
                                        padding: '4px 8px', 
                                        background: '#f44336', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer', 
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap'
                                      }}>
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PendingEditsPage; 