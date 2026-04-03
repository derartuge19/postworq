import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api';

export function EditCampaignModal({ theme, campaign, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: campaign.title || '',
    description: campaign.description || '',
    prize_title: campaign.prize_title || '',
    prize_description: campaign.prize_description || '',
    prize_value: campaign.prize_value || '',
    status: campaign.status || 'draft',
    min_followers: campaign.min_followers || 0,
    min_level: campaign.min_level || 1,
    min_votes_per_reel: campaign.min_votes_per_reel || 0,
    required_hashtags: campaign.required_hashtags || '',
    winner_count: campaign.winner_count || 1,
    start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().slice(0, 16) : '',
    entry_deadline: campaign.entry_deadline ? new Date(campaign.entry_deadline).toISOString().slice(0, 16) : '',
    voting_start: campaign.voting_start ? new Date(campaign.voting_start).toISOString().slice(0, 16) : '',
    voting_end: campaign.voting_end ? new Date(campaign.voting_end).toISOString().slice(0, 16) : '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(campaign.image || null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
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
      formDataToSend.append('required_hashtags', formData.required_hashtags);
      formDataToSend.append('winner_count', formData.winner_count);
      
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
      
      await api.request(`/admin/campaigns/${campaign.id}/update/`, {
        method: 'PATCH',
        body: formDataToSend,
        isFormData: true
      });
      // Show success message before closing
      setSuccessMessage('Campaign updated successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      console.error('Failed to update campaign:', error);
      console.log('Error status:', error.status);
      
      // Check if campaign not found (404)
      const isNotFound = error.status === 404 || 
                        (error.message && error.message.toLowerCase().includes('not found'));
      
      if (isNotFound) {
        setError('This campaign no longer exists in the database. It will be removed from the list.');
        setTimeout(() => {
          onSuccess('CAMPAIGN_NOT_FOUND');
        }, 2000);
      } else {
        const errorMsg = typeof error === 'string' ? error : error.message || 'Failed to update campaign';
        setError(errorMsg);
      }
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.card,
          borderRadius: 12,
          padding: 32,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.txt }}>
            Edit Campaign
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: theme.sub,
            }}
          >
            <X size={24} />
          </button>
        </div>

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
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
              Campaign Title *
            </label>
            <input
              type="text"
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
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
              Description *
            </label>
            <textarea
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
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
              Campaign Banner Image
            </label>
            <div
              style={{
                border: `2px dashed ${theme.border}`,
                borderRadius: 8,
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => document.getElementById('edit-image-upload').click()}
            >
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(campaign.image || null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: theme.red,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
                  <div style={{ fontSize: 14, color: theme.txt, marginBottom: 4 }}>
                    Click to upload banner image
                  </div>
                  <div style={{ fontSize: 12, color: theme.sub }}>
                    PNG, JPG up to 10MB
                  </div>
                </div>
              )}
              <input
                id="edit-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                Prize Title *
              </label>
              <input
                type="text"
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
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
                Prize Value ($) *
              </label>
              <input
                type="number"
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
                }}
              />
            </div>
          </div>

          {/* Entry Requirements */}
          <div style={{ 
            padding: 16, 
            background: theme.blue + '08', 
            borderRadius: 8,
            border: `1px solid ${theme.blue}30`,
            marginBottom: 20,
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

          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: 12,
                background: 'transparent',
                border: `2px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: theme.txt,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: 12,
                background: theme.pri,
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Update Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
