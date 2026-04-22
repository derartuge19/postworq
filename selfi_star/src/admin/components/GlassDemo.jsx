import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function GlassDemo({ theme }) {
  const { glassEnabled, toggleGlassEffect } = useTheme();

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{
        margin: '0 0 24px 0',
        fontSize: 24,
        fontWeight: 700,
        color: theme.txt,
      }}>
        Glassmorphism Crystal UI Demo
      </h2>

      {/* Glass Effect Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
        padding: 16,
        background: theme.bg,
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
      }}>
        <button
          onClick={toggleGlassEffect}
          style={{
            padding: '8px 16px',
            background: glassEnabled ? theme.pri : theme.border,
            color: glassEnabled ? '#fff' : theme.txt,
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {glassEnabled ? 'Disable' : 'Enable'} Glass Effect
        </button>
        <span style={{ fontSize: 14, color: theme.sub }}>
          Current status: {glassEnabled ? 'Crystal UI Active' : 'Standard Theme'}
        </span>
      </div>

      {/* Demo Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {/* Glass Card */}
        <div className="glass-card glass-hover" style={{
          padding: 20,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{
            width: 48,
            height: 48,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.pri}, ${theme.pri}80)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            Crystal
          </div>
          <h3 style={{ margin: '0 0 8px 0', color: theme.txt }}>Glass Card</h3>
          <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
            Hover to see the crystal effect
          </p>
        </div>

        {/* Glass Button */}
        <div className="glass-card glass-hover" style={{
          padding: 20,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <button className="glass-button glass-hover" style={{
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            width: '100%',
          }}>
            Crystal Button
          </button>
          <p style={{ margin: '12px 0 0 0', fontSize: 14, color: theme.sub }}>
            Interactive glass button
          </p>
        </div>

        {/* Glass Input */}
        <div className="glass-card glass-hover" style={{
          padding: 20,
          borderRadius: 12,
        }}>
          <input
            type="text"
            placeholder="Crystal input field..."
            className="glass-input"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              marginBottom: 12,
            }}
          />
          <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
            Glass input with blur
          </p>
        </div>
      </div>

      {/* Glass Navbar Demo */}
      <div className="glass-navbar" style={{
        padding: '16px 20px',
        borderRadius: 12,
        marginBottom: 32,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: theme.txt,
          }}>
            Crystal Navbar
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="glass-button" style={{ padding: '8px 16px', fontSize: 12 }}>
              Home
            </button>
            <button className="glass-button" style={{ padding: '8px 16px', fontSize: 12 }}>
              Profile
            </button>
            <button className="glass-button" style={{ padding: '8px 16px', fontSize: 12 }}>
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Glass Modal Demo */}
      <div className="glass-modal" style={{
        padding: 32,
        borderRadius: 16,
        maxWidth: 400,
        margin: '0 auto',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: theme.txt }}>Crystal Modal</h3>
        <p style={{ margin: '0 0 24px 0', color: theme.sub, lineHeight: 1.6 }}>
          This is a demonstration of the glassmorphism Crystal UI system. When enabled, 
          you'll see sophisticated blur effects, subtle reflections, and dynamic shadows 
          that create a premium crystal-like appearance.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="glass-button" style={{ flex: 1 }}>
            Confirm
          </button>
          <button className="glass-button" style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </div>

      {/* Glass Effects Info */}
      <div style={{
        marginTop: 32,
        padding: 20,
        background: theme.bg,
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: theme.txt }}>Glass Effects Applied:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: theme.sub, fontSize: 14 }}>
          <li>Backdrop blur effects (12px-24px)</li>
          <li>Semi-transparent backgrounds with rgba colors</li>
          <li>Subtle glass borders (rgba(255,255,255,0.2))</li>
          <li>Layered shadows and glow effects</li>
          <li>Light reflection animations</li>
          <li>Smooth hover transformations</li>
          <li>Theme-aware color integration</li>
        </ul>
      </div>
    </div>
  );
}
