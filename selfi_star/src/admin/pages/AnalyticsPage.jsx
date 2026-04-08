import { useState, useEffect } from 'react';
import { TrendingUp, Users, Video, DollarSign, Download, FileVideo } from 'lucide-react';
import api from '../../api';
import { AlertModal } from '../components/AlertModal';

export function AnalyticsPage({ theme }) {
  const [exporting, setExporting] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const handleExport = async (type) => {
    try {
      setExporting(true);
      const data = await api.request(`/admin/analytics/export/?type=${type}`);
      
      // Convert to CSV
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setAlertModal({ isOpen: true, title: 'Export Failed', message: 'Export failed. Please try again.', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const exportOptions = [
    {
      type: 'users',
      title: 'User Data',
      description: 'Export all user information including registration dates, activity, and stats',
      icon: Users,
      color: theme.blue,
    },
    {
      type: 'reels',
      title: 'Content Data',
      description: 'Export all reels with engagement metrics, creators, and timestamps',
      icon: FileVideo,
      color: theme.purple,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 700,
          color: theme.txt,
          marginBottom: 8,
        }}>
          Analytics & Reports
        </h1>
        <p style={{
          margin: 0,
          fontSize: 16,
          color: theme.sub,
        }}>
          Export data and generate reports
        </p>
      </div>

      {/* Export Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 24,
      }}>
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.type}
              style={{
                background: theme.card,
                borderRadius: 12,
                padding: 24,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: option.color + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={24} color={option.color} />
              </div>
              
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: theme.txt,
                marginBottom: 8,
              }}>
                {option.title}
              </h3>
              
              <p style={{
                margin: 0,
                fontSize: 14,
                color: theme.sub,
                lineHeight: 1.6,
                marginBottom: 20,
              }}>
                {option.description}
              </p>
              
              <button
                onClick={() => handleExport(option.type)}
                disabled={exporting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: option.color,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  opacity: exporting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!exporting) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export to CSV'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: 32,
        padding: 24,
        background: theme.pri + '15',
        border: `1px solid ${theme.pri}`,
        borderRadius: 12,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          <TrendingUp size={24} color={theme.pri} />
          <div>
            <h4 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: theme.txt,
              marginBottom: 8,
            }}>
              Export Information
            </h4>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: theme.sub,
              lineHeight: 1.6,
            }}>
              Exported data is provided in CSV format for easy analysis in spreadsheet applications. 
              All exports include the most recent data available in the system. For custom reports or 
              specific date ranges, please contact the development team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
