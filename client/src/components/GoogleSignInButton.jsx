// client/src/components/GoogleSignInButton.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GoogleSignInButton({ textType = 'signin', onSuccess, onError }) {
  const { googleLogin } = useAuth();
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '151182657317-t0nqi9l4ibiqg07ra31o45r8lc0gq91i.apps.googleusercontent.com';

  useEffect(() => {
    let timer = null;

    const renderGoogleBtn = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response?.credential) {
              try {
                setLoading(true);
                await googleLogin(response.credential);
                if (onSuccess) onSuccess();
              } catch (err) {
                if (onError) onError(err.message || 'Google Sign-in failed');
              } finally {
                setLoading(false);
              }
            }
          }
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          shape: 'pill',
          text: textType === 'signup' ? 'signup_with' : 'signin_with'
        });

        return true;
      } catch (e) {
        console.warn('Google GSI render error:', e);
        return false;
      }
    };

    if (!renderGoogleBtn()) {
      timer = setInterval(() => {
        if (renderGoogleBtn()) {
          clearInterval(timer);
        }
      }, 300);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [clientId, textType]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {loading && (
        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Connecting to Google...
        </div>
      )}
      <div
        ref={buttonRef}
        style={{
          minHeight: 44,
          display: loading ? 'none' : 'flex',
          justifyContent: 'center',
          width: '100%'
        }}
      />
    </div>
  );
}
