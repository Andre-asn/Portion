import { createBrowserRouter, redirect } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Signin } from './pages/Signin';
import { Dashboard } from './pages/Dashboard';
import { Buddies } from './pages/Buddies';
import { Tables } from './pages/Tables';
import { CreateTable } from './pages/CreateTable';

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
  {
    path: '/buddies',
    element: <Buddies />,
    loader: requireAuth,
  },
  {
    path: '/tables',
    element: <Tables />,
    loader: requireAuth,
  },
  {
    path: '/create-table',
    element: <CreateTable />,
    loader: requireAuth,
  }
]); 