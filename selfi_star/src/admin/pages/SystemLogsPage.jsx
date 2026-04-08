import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Info, AlertTriangle, Shield } from 'lucide-react';
import api from '../../api';

export function SystemLogsPage({ theme }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page, filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const typeParam = filter !== 'all' ? `&type=${filter}` : '';
      const response = await api.request(`/admin/logs/?page=${page}${typeParam}`);
      setLogs(response.logs);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logTypes = [
    { id: 'all', label: 'All Logs', icon: FileText, color: theme.txt },
    { id: 'info', label: 'Info', icon: Info, color: theme.blue },
    { id: 'warning', label: 'Warning', icon: AlertTriangle, color: theme.orange },
    { id: 'error', label: 'Error', icon: AlertCircle, color: theme.red },
    { id: 'security', label: 'Security', icon: Shield, color: theme.purple },
  ];

  const getLogIcon = (type) => {
    const logType = logTypes.find(t => t.id === type);
    return logType ? logType.icon : FileText;
  };

  const getLogColor = (type) => {
    const logType = logTypes.find(t => t.id === type);
    return logType ? logType.color : theme.txt;
  };

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
          System Logs
        </h1>
        <p style={{
          margin: 0,
          fontSize: 16,
          color: theme.sub,
        }}>
          Monitor system activity and events
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        {logTypes.map(type => {
          const Icon = type.icon;
          const isActive = filter === type.id;
          return (
            <button
              key={type.id}
              onClick={() => {
                setFilter(type.id);
                setPage(1);
              }}
              style={{
                padding: '10px 16px',
                background: isActive ? type.color + '15' : theme.card,
                border: `1px solid ${isActive ? type.color : theme.border}`,
                borderRadius: 8,
                color: isActive ? type.color : theme.txt,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icon size={16} />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Logs List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
          Loading logs...
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          background: theme.card,
          borderRadius: 12,
          padding: 60,
          textAlign: 'center',
          border: `1px solid ${theme.border}`,
        }}>
          <FileText size={48} color={theme.sub} style={{ marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
            No logs found
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
            No system logs match your current filter
          </p>
        </div>
      ) : (
        <>
          <div style={{
            background: theme.card,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
          }}>
            {logs.map((log, index) => {
              const Icon = getLogIcon(log.log_type);
              const color = getLogColor(log.log_type);
              
              return (
                <div
                  key={log.id}
                  style={{
                    padding: 20,
                    borderBottom: index < logs.length - 1 ? `1px solid ${theme.border}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: color + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} color={color} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                      }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: color + '20',
                          color: color,
                        }}>
                          {log.log_type}
                        </span>
                        <span style={{ fontSize: 13, color: theme.sub }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                        {log.user && (
                          <span style={{ fontSize: 13, color: theme.sub }}>
                            by {log.user}
                          </span>
                        )}
                      </div>
                      
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.txt,
                        marginBottom: 8,
                      }}>
                        {log.message}
                      </div>
                      
                      {log.endpoint && (
                        <div style={{
                          fontSize: 13,
                          color: theme.sub,
                          fontFamily: 'monospace',
                          marginBottom: 8,
                        }}>
                          {log.endpoint}
                        </div>
                      )}
                      
                      {log.details && (
                        <details style={{ marginTop: 8 }}>
                          <summary style={{
                            fontSize: 13,
                            color: theme.pri,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}>
                            View Details
                          </summary>
                          <pre style={{
                            marginTop: 8,
                            padding: 12,
                            background: theme.bg,
                            borderRadius: 6,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            overflow: 'auto',
                            maxHeight: 200,
                          }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  background: page === 1 ? theme.bg : theme.pri,
                  border: 'none',
                  borderRadius: 6,
                  color: page === 1 ? theme.sub : '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: theme.txt,
              }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  background: page === totalPages ? theme.bg : theme.pri,
                  border: 'none',
                  borderRadius: 6,
                  color: page === totalPages ? theme.sub : '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
