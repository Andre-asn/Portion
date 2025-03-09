import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';

function App({ children }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle initial session and OAuth callback
    const handleAuthCallback = async () => {
      setLoading(true);
      
      // Get session from URL if present (OAuth callback)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('access_token')) {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: hashParams.get('access_token'),
          refresh_token: hashParams.get('refresh_token'),
        });
        
        if (!error && session) {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate('/dashboard');
        }
      }
      
      setLoading(false);
    };

    handleAuthCallback();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && location.pathname === '/') {
        navigate('/dashboard');
      } else if (!session && location.pathname !== '/') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F3]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0FA3B1]"></div>
      </div>
    );
  }

  return children;
}

export default App;