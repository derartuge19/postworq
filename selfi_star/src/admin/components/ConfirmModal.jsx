export function ConfirmModal({ theme, isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) {
  if (!isOpen) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'danger': return theme.red;
      case 'warning': return theme.orange;
      case 'success': return theme.green;
      case 'info': return theme.blue;
      default: return theme.pri;
    }
  };

  const typeColor = getTypeColor();

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
        zIndex: 99999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.card,
          borderRadius: 12,
          padding: '24px',
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: theme.txt,
          marginBottom: 12,
        }}>
          {title}
        </h3>
        
        <p style={{
          margin: 0,
          fontSize: 14,
          color: theme.sub,
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          {message}
        </p>
        
        <div style={{
          display: 'flex',
          gap: 12,
          flexDirection: window.innerWidth < 640 ? 'column' : 'row',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              color: theme.txt,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: typeColor,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
