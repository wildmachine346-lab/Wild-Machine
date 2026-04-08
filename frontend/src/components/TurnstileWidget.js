import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SITEKEY = process.env.REACT_APP_TURNSTILE_SITE_KEY;

export function TurnstileWidget({ onVerify, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.turnstile) {
      setLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
    return () => {
      const s = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (s) document.head.removeChild(s);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        theme: 'dark',
        callback: (token) => onVerify?.(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onVerify?.(''),
      });
    } catch (e) {
      console.error('Turnstile render error:', e);
    }
  }, [loaded, onVerify, onError]);

  return <div ref={containerRef} data-testid="turnstile-widget" className="flex justify-center my-2" />;
}
