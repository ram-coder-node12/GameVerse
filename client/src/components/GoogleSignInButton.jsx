// client/src/components/GoogleSignInButton.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GoogleSignInButton({ textType = 'signin', onSuccess, onError }) {
  const { googleLogin } = useAuth();
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '151182657317-t0nqi9l4ibiqg07ra31o45r8lc0gq91i.apps.googleusercontent.com';

  useEffect(() => {
    let intervalId = null;

    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        if (intervalId) clearInterval(intervalId);
        initializeGsi();
      }
    };

    const initializeGsi = () => {
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

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 356,
            shape: 'pill',
            text: textType === 'signup' ? 'signup_with' : 'signin_with',
            logo_alignment: 'left'
          });
        }
      } catch (err) {
        console.warn('Google GSI render error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      initializeGsi();
    } else {
      intervalId = setInterval(checkGsi, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId, textType]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {loading ? (
        <div
          style={{
            padding: '10px 16px',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            textAlign: 'center'
          }}
        >
          Connecting to Google...
        </div>
      ) : (
        <div
          ref={buttonRef}
          style={{
            minHeight: 44,
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {!scriptLoaded && (
            <button
              type="button"
              disabled
              className="btn btn-secondary"
              style={{
                width: '100%',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Loading Google Sign-In...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
