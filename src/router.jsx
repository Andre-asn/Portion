import { createBrowserRouter, redirect } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Signin } from './components/Signin';
import { Dashboard } from './components/Dashboard';

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirect('/');
  }
  
  return null;
}

async function requireNoAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    return redirect('/dashboard');
  }
  
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Signin />,
    loader: requireNoAuth,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    loader: requireAuth,
  },
]); 