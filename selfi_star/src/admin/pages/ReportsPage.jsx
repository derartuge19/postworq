import { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, AlertCircle, Eye, Trash2, User, FileVideo, MessageSquare, RefreshCw } from 'lucide-react';
import api from '../api';

export function ReportsPage({ theme }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await api.request(`/admin/reports/${params}`);
      setReports(response || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.request('/admin/reports/stats/');
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await api.request(`/admin/reports/${reportId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: resolutionNotes
        }),
      });
      fetchReports();
      fetchStats();
      setSelectedReport(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.orange;
      case 'reviewing': return theme.blue;
      case 'resolved': return theme.green;
      case 'dismissed': return theme.sub;
      default: return theme.txt;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'reviewing': return Eye;
      case 'resolved': return CheckCircle;
      case 'dismissed': return XCircle;
      default: return Flag;
    }
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      'inappropriate': 'Inappropriate Content',
      'spam': 'Spam',
      'harassment': 'Harassment',
      'copyright': 'Copyright Violation',
      'scam': 'Scam/Fraud',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: theme.txt,
            marginBottom: 4,
          }}>
            Reports Management
          </h1>
          <p style={{
            fontSize: 14,
            color: theme.sub,
          }}>
            Review and manage user reports
          </p>
        </div>
        <button
          onClick={() => { fetchReports(); fetchStats(); }}
          style={{
            padding: '10px 16px',
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: theme.txt,
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {[
            { label: 'Total', value: stats.total_reports, color: theme.txt },
            { label: 'Pending', value: stats.pending_reports, color: theme.orange },
            { label: 'Reviewing', value: stats.reviewing_reports, color: theme.blue },
            { label: 'Resolved', value: stats.resolved_reports, color: theme.green },
            { label: 'Dismissed', value: stats.dismissed_reports, color: theme.sub },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: 16,
                background: theme.card,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: stat.color,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 12,
                color: theme.sub,
                marginTop: 4,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: 12,
      }}>
        {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              background: filterStatus === status ? theme.pri : 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: filterStatus === status ? 600 : 500,
              color: filterStatus === status ? '#fff' : theme.txt,
              textTransform: 'capitalize',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: theme.sub,
        }}>
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: theme.card,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
        }}>
          <Flag size={48} style={{ color: theme.sub, marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
            No reports found
          </h3>
          <p style={{ fontSize: 14, color: theme.sub }}>
            {filterStatus === 'all' 
              ? 'There are no reports to review at this time.'
              : `No ${filterStatus} reports found.`}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {reports.map((report) => {
            const StatusIcon = getStatusIcon(report.status);
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                style={{
                  padding: 16,
                  background: theme.card,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `${getStatusColor(report.status)}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <StatusIcon size={20} color={getStatusColor(report.status)} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.txt,
                        marginBottom: 4,
                      }}>
                        {getReportTypeLabel(report.report_type)}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: theme.sub,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span>By: {report.reported_by?.username || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    background: `${getStatusColor(report.status)}20`,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    color: getStatusColor(report.status),
                    textTransform: 'capitalize',
                  }}>
                    {report.status}
                  </div>
                </div>

                <div style={{
                  marginTop: 12,
                  padding: 12,
                  background: theme.bg,
                  borderRadius: 8,
                  fontSize: 13,
                  color: theme.txt,
                }}>
                  {report.description || 'No description provided'}
                </div>

                <div style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: 16,
                  fontSize: 12,
                  color: theme.sub,
                }}>
                  {report.reported_reel && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileVideo size={14} />
                      Reel #{report.reported_reel}
                    </span>
                  )}
                  {report.reported_user && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={14} />
                      User: {report.reported_user?.username}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
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
          }}
          onClick={() => setSelectedReport(null)}
        >
          <div
            style={{
              background: theme.card,
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.txt }}>
                Report Details
              </h2>
              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: theme.sub,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: 'block' }}>
                Report Type
              </label>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.txt }}>
                {getReportTypeLabel(selectedReport.report_type)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: 'block' }}>
                Reported By
              </label>
              <div style={{ fontSize: 14, color: theme.txt }}>
                {selectedReport.reported_by?.username || 'Unknown'}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: 'block' }}>
                Description
              </label>
              <div style={{
                padding: 12,
                background: theme.bg,
                borderRadius: 8,
                fontSize: 14,
                color: theme.txt,
              }}>
                {selectedReport.description || 'No description'}
              </div>
            </div>

            {selectedReport.resolution_notes && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: 'block' }}>
                  Resolution Notes
                </label>
                <div style={{ fontSize: 14, color: theme.txt }}>
                  {selectedReport.resolution_notes}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: theme.sub, marginBottom: 4, display: 'block' }}>
                Resolution Notes (optional)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                style={{
                  width: '100%',
                  padding: 12,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  minHeight: 80,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              {selectedReport.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate(selectedReport.id, 'reviewing')}
                  style={{
                    padding: '10px 20px',
                    background: theme.blue,
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Eye size={16} />
                  Mark Reviewing
                </button>
              )}
              
              {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'resolved')}
                    style={{
                      padding: '10px 20px',
                      background: theme.green,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CheckCircle size={16} />
                    Resolve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'dismissed')}
                    style={{
                      padding: '10px 20px',
                      background: theme.sub,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <XCircle size={16} />
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
