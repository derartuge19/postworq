import { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2, Users, Award } from 'lucide-react';
import api from '../../api';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditCampaignModal } from './EditCampaignModal';

export function CampaignManagementPage({ theme, onManageCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [successModal, setSuccessModal] = useState({ isOpen: false, campaign: null });

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const filterParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.request(`/admin/campaigns/${filterParam}`);
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      // Clear campaigns on error to avoid stale data
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (campaign) => {
    const deleteUrl = `/admin/campaigns/${campaign.id}/delete/`;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Campaign',
      message: `Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`,
      type: 'danger',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.request(deleteUrl, { method: 'DELETE' });
          // Immediately remove from list
          setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
          // Show success notification
          setConfirmModal({ 
            isOpen: true, 
            title: 'Success', 
            message: `Campaign "${campaign.title}" deleted successfully!`,
            type: 'success',
            showCancel: false,
            onConfirm: () => setConfirmModal({ isOpen: false })
          });
        } catch (error) {
          console.error('[DELETE] Failed:', error);
          
          if (error.status === 404) {
            // Already gone, remove from list
            setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
            setConfirmModal({ 
              isOpen: true, 
              title: 'Campaign Removed', 
              message: 'Campaign was already deleted.',
              type: 'info',
              showCancel: false,
              onConfirm: () => setConfirmModal({ isOpen: false })
            });
          } else {
            setConfirmModal({ 
              isOpen: true, 
              title: 'Error', 
              message: 'Failed to delete campaign. Please try again.',
              type: 'error',
              showCancel: false,
              onConfirm: () => setConfirmModal({ isOpen: false })
            });
          }
        }
      },
      onCancel: () => setConfirmModal({ isOpen: false })
    });
  };

  const handleAnnounceWinners = (campaign) => {
    setConfirmModal({
      isOpen: true,
      title: 'Announce Winners',
      message: `Announce winners for "${campaign.title}"? Top ${campaign.winner_count} entries will be selected.`,
      type: 'success',
      onConfirm: async () => {
        try {
          await api.request(`/admin/campaigns/${campaign.id}/announce-winners/`, { method: 'POST' });
          loadCampaigns();
        } catch (error) {
          console.error('Failed to announce winners:', error);
        }
      }
    });
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      await api.request(`/admin/campaigns/${campaignId}/update/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      // Update local state immediately
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, status: newStatus } : c
      ));
      // Show success message
      setConfirmModal({
        isOpen: true,
        title: 'Success',
        message: `Campaign status updated to "${newStatus}"`,
        type: 'success',
        showCancel: false,
        onConfirm: () => setConfirmModal({ isOpen: false })
      });
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      if (error.status === 404) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setConfirmModal({
          isOpen: true,
          title: 'Campaign Not Found',
          message: 'Campaign no longer exists.',
          type: 'error',
          showCancel: false,
          onConfirm: () => setConfirmModal({ isOpen: false })
        });
      } else {
        setConfirmModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to update campaign status. Please try again.',
          type: 'error',
          showCancel: false,
          onConfirm: () => setConfirmModal({ isOpen: false })
        });
      }
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.green;
      case 'voting': return theme.blue;
      case 'completed': return theme.sub;
      case 'draft': return theme.orange;
      case 'cancelled': return theme.red;
      default: return theme.sub;
    }
  };

  return (
    <div style={{ marginLeft: 240, padding: '20px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
        marginBottom: 32,
        gap: 16,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: window.innerWidth < 768 ? 24 : 32,
            fontWeight: 700,
            color: theme.txt,
            marginBottom: 8,
          }}>
            Campaign Management
          </h1>
          <p style={{
            margin: 0,
            fontSize: window.innerWidth < 768 ? 14 : 16,
            color: theme.sub,
          }}>
            Create and manage prize campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            background: theme.pri,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: window.innerWidth < 768 ? '100%' : 'auto',
            justifyContent: 'center',
          }}
        >
          <Plus size={16} />
          Create Campaign
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        overflowX: 'auto',
        paddingBottom: 8,
      }}>
        {['all', 'draft', 'active', 'voting', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '8px 16px',
              background: statusFilter === status ? theme.pri + '20' : theme.card,
              border: `1px solid ${statusFilter === status ? theme.pri : theme.border}`,
              borderRadius: 8,
              color: statusFilter === status ? theme.pri : theme.txt,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
          Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{
          background: theme.card,
          borderRadius: 12,
          padding: 60,
          textAlign: 'center',
          border: `1px solid ${theme.border}`,
        }}>
          <Trophy size={48} color={theme.sub} style={{ marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
            No campaigns yet
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
            Create your first campaign to get started
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 24,
        }}>
          {campaigns.map(campaign => {
            const statusColor = getStatusColor(campaign.status);
            
            return (
              <div
                key={campaign.id}
                style={{
                  background: theme.card,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `1px solid ${theme.border}`,
                }}
              >
                {campaign.image && (
                  <div style={{
                    width: '100%',
                    height: 200,
                    background: `url(${campaign.image}) center/cover`,
                  }} />
                )}
                
                <div style={{ padding: 20 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: theme.txt,
                      flex: 1,
                    }}>
                      {campaign.title}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: statusColor + '20',
                      color: statusColor,
                      marginLeft: 8,
                    }}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: theme.sub, marginBottom: 6 }}>
                      Change Status:
                    </label>
                    <select
                      value={campaign.status}
                      onChange={(e) => handleStatusChange(campaign.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: `2px solid ${theme.border}`,
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.txt,
                        background: '#fff',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="active">✅ Active (Accepting Entries)</option>
                      <option value="voting">🗳️ Voting Phase</option>
                      <option value="completed">🏁 Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                  
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: theme.sub,
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}>
                    {campaign.description.substring(0, 100)}...
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 16,
                    padding: '12px 0',
                    borderTop: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.border}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>
                        Prize
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: theme.pri }}>
                        ${campaign.prize_value}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>
                        Entries
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: theme.txt }}>
                        {campaign.total_entries}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4 }}>
                        Votes
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: theme.txt }}>
                        {campaign.total_votes}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: theme.blue + '15',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.blue,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Users size={14} />
                      View Entries
                    </button>
                    {campaign.status === 'voting' && !campaign.winners_announced && (
                      <button
                        onClick={() => handleAnnounceWinners(campaign)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: theme.green + '15',
                          border: 'none',
                          borderRadius: 6,
                          color: theme.green,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Award size={14} />
                        Winners
                      </button>
                    )}
                  </div>
                  
                  {/* Campaign Management Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onManageCampaign?.(campaign.id, 'scoring')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: theme.purple + '15',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.purple,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ⚙️ Scoring
                    </button>
                    <button
                      onClick={() => onManageCampaign?.(campaign.id, 'themes')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: theme.orange + '15',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.orange,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      📅 Themes
                    </button>
                    <button
                      onClick={() => onManageCampaign?.(campaign.id, 'moderation')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: theme.green + '15',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.green,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✅ Moderate
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleEditCampaign(campaign)}
                      style={{
                        padding: '8px',
                        background: theme.orange + '15',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.orange,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign)}
                      style={{
                        padding: '8px',
                        background: theme.red + '15',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.red,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          theme={theme}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(response) => {
            setShowCreateModal(false);
            setSuccessModal({ isOpen: true, campaign: response });
            loadCampaigns();
          }}
        />
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <SuccessModal
          theme={theme}
          campaign={successModal.campaign}
          onClose={() => setSuccessModal({ isOpen: false, campaign: null })}
        />
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && editingCampaign && (
        <EditCampaignModal
          theme={theme}
          campaign={editingCampaign}
          onClose={() => {
            setShowEditModal(false);
            setEditingCampaign(null);
          }}
          onSuccess={(result) => {
            setShowEditModal(false);
            setEditingCampaign(null);
            if (result === 'CAMPAIGN_NOT_FOUND') {
              // Remove the stale campaign from the list
              setCampaigns(prev => prev.filter(c => c.id !== editingCampaign.id));
            } else {
              loadCampaigns();
            }
          }}
        />
      )}

      {/* Campaign Entries Modal */}
      {selectedCampaign && (
        <CampaignEntriesModal
          theme={theme}
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        theme={theme}
        {...confirmModal}
        onClose={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}

function CreateCampaignModal({ theme, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_title: '',
    prize_description: '',
    prize_value: '',
    status: 'active',
    min_followers: 0,
    min_level: 1,
    min_votes_per_reel: 0,
    required_hashtags: '',
    start_date: '',
    entry_deadline: '',
    voting_start: '',
    voting_end: '',
    winner_count: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('prize_title', formData.prize_title);
      formDataToSend.append('prize_description', formData.prize_description || formData.prize_title);
      formDataToSend.append('prize_value', formData.prize_value);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('min_followers', formData.min_followers);
      formDataToSend.append('min_level', formData.min_level);
      formDataToSend.append('min_votes_per_reel', formData.min_votes_per_reel);
      formDataToSend.append('winner_count', formData.winner_count);
      formDataToSend.append('required_hashtags', formData.required_hashtags);
      
      // Convert dates to ISO format
      if (formData.start_date) {
        formDataToSend.append('start_date', new Date(formData.start_date).toISOString());
      }
      if (formData.entry_deadline) {
        formDataToSend.append('entry_deadline', new Date(formData.entry_deadline).toISOString());
      }
      if (formData.voting_start) {
        formDataToSend.append('voting_start', new Date(formData.voting_start).toISOString());
      }
      if (formData.voting_end) {
        formDataToSend.append('voting_end', new Date(formData.voting_end).toISOString());
      }
      
      // Add image if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      const response = await api.request('/admin/campaigns/create/', {
        method: 'POST',
        body: formDataToSend,
        isFormData: true
      });
      setIsSubmitting(false);
      onSuccess(response);
    } catch (error) {
      setIsSubmitting(false);
      console.error('Failed to create campaign:', error);
      const errorMsg = typeof error === 'string' ? error : error.message || 'Failed to create campaign';
      setError(errorMsg);
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.txt, marginBottom: 8 }}>
          Create New Campaign
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: theme.sub, marginBottom: 32 }}>
          Set up a prize competition for your users
        </p>
        
        {error && (
          <div style={{
            padding: 12,
            background: theme.red + '15',
            border: `1px solid ${theme.red}`,
            borderRadius: 8,
            color: theme.red,
            fontSize: 14,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Basic Info */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                Campaign Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Summer Photo Contest 2024"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: 12,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.pri}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                Description *
              </label>
              <textarea
                placeholder="Describe your campaign..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: 12,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.pri}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>
            
            {/* Banner Image/Video */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                Campaign Banner (Image or Video)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="campaign-image-upload"
              />
              <div 
                onClick={() => document.getElementById('campaign-image-upload').click()}
                style={{
                  border: `2px dashed ${theme.border}`,
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: imagePreview ? 'transparent' : theme.bg,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = theme.pri;
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = theme.border;
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    handleImageChange({ target: { files: [file] } });
                  }
                }}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="Preview" style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 8,
                    }} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        padding: '4px 8px',
                        background: theme.red,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontSize: 14, color: theme.txt, marginBottom: 4 }}>
                      Click to upload or drag and drop
                    </div>
                    <div style={{ fontSize: 12, color: theme.sub }}>
                      PNG, JPG, GIF or MP4 (Max 10MB)
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: theme.sub, textAlign: 'center' }}>
                Optional: Add an eye-catching banner to attract participants
              </div>
            </div>
            
            {/* Prize Info */}
            <div style={{ 
              padding: 16, 
              background: theme.pri + '08', 
              borderRadius: 8,
              border: `1px solid ${theme.pri}30`,
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.txt, marginBottom: 16 }}>
                Prize Details
              </h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                  Prize Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., $500 Cash Prize"
                  value={formData.prize_title}
                  onChange={(e) => setFormData({ ...formData, prize_title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    border: `2px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.pri}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                  Prize Description
                </label>
                <textarea
                  placeholder="Describe the prize details..."
                  value={formData.prize_description}
                  onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: `2px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.pri}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                  Prize Value ($) *
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={formData.prize_value}
                  onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: `2px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.pri}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              </div>
            </div>
            
            {/* Timeline */}
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.txt, marginBottom: 16 }}>
                Campaign Timeline
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Start Date */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Start Date & Time *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <input
                      type="date"
                      value={formData.start_date.split('T')[0] || ''}
                      onChange={(e) => {
                        const time = formData.start_date.split('T')[1] || '09:00';
                        setFormData({ ...formData, start_date: `${e.target.value}T${time}` });
                      }}
                      required
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <select
                      value={formData.start_date.split('T')[1]?.split(':')[0] || '09'}
                      onChange={(e) => {
                        const date = formData.start_date.split('T')[0] || '';
                        const mins = formData.start_date.split(':')[1] || '00';
                        setFormData({ ...formData, start_date: `${date}T${e.target.value}:${mins}` });
                      }}
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    >
                      {[...Array(12)].map((_, i) => {
                        const hour = i + 1;
                        return <option key={hour} value={hour.toString().padStart(2, '0')}>{hour}:00 AM</option>;
                      })}
                      {[...Array(12)].map((_, i) => {
                        const hour = i + 13;
                        return <option key={hour} value={hour.toString().padStart(2, '0')}>{i + 1}:00 PM</option>;
                      })}
                    </select>
                  </div>
                </div>
                
                {/* Entry Deadline */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Entry Deadline *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <input
                      type="date"
                      value={formData.entry_deadline.split('T')[0] || ''}
                      onChange={(e) => {
                        const time = formData.entry_deadline.split('T')[1] || '23:59';
                        setFormData({ ...formData, entry_deadline: `${e.target.value}T${time}` });
                      }}
                      required
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <select
                      value={formData.entry_deadline.split('T')[1]?.split(':')[0] || '23'}
                      onChange={(e) => {
                        const date = formData.entry_deadline.split('T')[0] || '';
                        const mins = formData.entry_deadline.split(':')[1] || '59';
                        setFormData({ ...formData, entry_deadline: `${date}T${e.target.value}:${mins}` });
                      }}
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    >
                      {[...Array(12)].map((_, i) => {
                        const hour = i + 1;
                        return <option key={hour} value={hour.toString().padStart(2, '0')}>{hour}:00 AM</option>;
                      })}
                      {[...Array(12)].map((_, i) => {
                        const hour = i + 13;
                        return <option key={hour} value={hour.toString().padStart(2, '0')}>{i + 1}:00 PM</option>;
                      })}
                    </select>
                  </div>
                </div>
                
                {/* Voting Start */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Voting Start *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <input
                      type="date"
                      value={formData.voting_start.split('T')[0] || ''}
                      onChange={(e) => {
                        const time = formData.voting_start.split('T')[1] || '00:00';
                        setFormData({ ...formData, voting_start: `${e.target.value}T${time}` });
                      }}
                      required
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <select
                      value={formData.voting_start.split('T')[1]?.split(':')[0] || '00'}
                      onChange={(e) => {
                        const date = formData.voting_start.split('T')[0] || '';
                        const mins = formData.voting_start.split(':')[1] || '00';
                        setFormData({ ...formData, voting_start: `${date}T${e.target.value}:${mins}` });
                      }}
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    >
                      {[...Array(12)].map((_, i) => {
                        const hour = i === 0 ? 12 : i;
                        return <option key={i} value={i.toString().padStart(2, '0')}>{hour}:00 AM</option>;
                      })}
                      {[...Array(12)].map((_, i) => {
                        const hour = i === 0 ? 12 : i;
                        return <option key={i + 12} value={(i + 12).toString().padStart(2, '0')}>{hour}:00 PM</option>;
                      })}
                    </select>
                  </div>
                </div>
                
                {/* Voting End */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Voting End *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <input
                      type="date"
                      value={formData.voting_end.split('T')[0] || ''}
                      onChange={(e) => {
                        const time = formData.voting_end.split('T')[1] || '23:59';
                        setFormData({ ...formData, voting_end: `${e.target.value}T${time}` });
                      }}
                      required
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <select
                      value={formData.voting_end.split('T')[1]?.split(':')[0] || '23'}
                      onChange={(e) => {
                        const date = formData.voting_end.split('T')[0] || '';
                        const mins = formData.voting_end.split(':')[1] || '59';
                        setFormData({ ...formData, voting_end: `${date}T${e.target.value}:${mins}` });
                      }}
                      style={{
                        padding: 12,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    >
                      {[...Array(12)].map((_, i) => {
                        const hour = i === 0 ? 12 : i;
                        return <option key={i} value={i.toString().padStart(2, '0')}>{hour}:00 AM</option>;
                      })}
                      {[...Array(12)].map((_, i) => {
                        const hour = i === 0 ? 12 : i;
                        return <option key={i + 12} value={(i + 12).toString().padStart(2, '0')}>{hour}:00 PM</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Entry Criteria */}
            <div style={{ 
              padding: 16, 
              background: theme.blue + '08', 
              borderRadius: 8,
              border: `1px solid ${theme.blue}30`,
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.txt, marginBottom: 16 }}>
                Entry Requirements
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Min Followers
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.min_followers}
                    onChange={(e) => setFormData({ ...formData, min_followers: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Min Level
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.min_level}
                    onChange={(e) => setFormData({ ...formData, min_level: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Min Votes Per Reel
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.min_votes_per_reel}
                    onChange={(e) => setFormData({ ...formData, min_votes_per_reel: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                    Number of Winners *
                  </label>
                  <input
                    type="number"
                    placeholder="3"
                    value={formData.winner_count}
                    onChange={(e) => setFormData({ ...formData, winner_count: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                  Required Hashtags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="#contest, #giveaway, #challenge"
                  value={formData.required_hashtags}
                  onChange={(e) => setFormData({ ...formData, required_hashtags: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: `2px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#fff',
                  border: `2px solid ${theme.border}`,
                  borderRadius: 8,
                  color: theme.txt,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = theme.bg}
                onMouseLeave={(e) => e.target.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: 14,
                  background: isSubmitting ? theme.sub : theme.pri,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSubmitting ? 'none' : `0 4px 12px ${theme.pri}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => !isSubmitting && (e.target.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: 18,
                      height: 18,
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Creating...
                  </>
                ) : 'Create Campaign'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CampaignEntriesModal({ theme, campaign, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await api.request(`/admin/campaigns/${campaign.id}/entries/`);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isMobile ? 0 : 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.card,
          borderRadius: isMobile ? '20px 20px 0 0' : 12,
          padding: isMobile ? 20 : 32,
          width: '100%',
          maxWidth: 800,
          maxHeight: isMobile ? '90vh' : '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.txt, marginBottom: 24 }}>
          {campaign.title} - Entries ({entries.length})
        </h2>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
            Loading entries...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
            No entries yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  padding: 16,
                  background: theme.bg,
                  borderRadius: 8,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: entry.is_winner ? theme.pri : theme.sub + '30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: entry.is_winner ? '#fff' : theme.txt,
                  flexShrink: 0,
                }}>
                  {entry.rank || index + 1}
                </div>
                
                {entry.reel.image && (
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    background: `url(${entry.reel.image}) center/cover`,
                    flexShrink: 0,
                  }} />
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 4 }}>
                    @{entry.user.username}
                  </div>
                  <div style={{ fontSize: 13, color: theme.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.reel.caption}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: theme.pri }}>
                    {entry.vote_count}
                  </div>
                  <div style={{ fontSize: 11, color: theme.sub }}>
                    votes
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessModal({ theme, campaign, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20,
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmark {
          0% { transform: scale(0) rotate(-45deg); }
          50% { transform: scale(1.2) rotate(-45deg); }
          100% { transform: scale(1) rotate(-45deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '40px 48px',
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.green}20, ${theme.green}40)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 36,
              height: 18,
              borderLeft: `5px solid ${theme.green}`,
              borderBottom: `5px solid ${theme.green}`,
              transform: 'rotate(-45deg)',
              marginTop: -8,
              animation: 'checkmark 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
            }}
          />
        </div>

        {/* Title */}
        <h2
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            color: theme.txt,
            marginBottom: 12,
          }}
        >
          Campaign Created! 🎉
        </h2>

        {/* Message */}
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: theme.sub,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          "{campaign?.title || 'Your campaign'}" has been successfully created and is now live!
        </p>

        {/* Campaign ID Badge */}
        {campaign?.id && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: theme.pri + '10',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              color: theme.pri,
              marginBottom: 24,
            }}
          >
            <Trophy size={14} />
            Campaign ID: #{campaign.id}
          </div>
        )}

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            background: theme.border,
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, ${theme.green}, ${theme.pri})`,
              borderRadius: 2,
              animation: 'progress 3s linear',
            }}
          />
        </div>
        <style>{`
          @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>

        {/* Auto close hint */}
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: theme.sub,
          }}
        >
          Closing automatically in 3 seconds...
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: '12px 32px',
            background: theme.pri,
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: `0 4px 12px ${theme.pri}40`,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 20px ${theme.pri}60`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 4px 12px ${theme.pri}40`;
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
