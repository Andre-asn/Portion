import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  const titleVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const letterVariants = {
    hidden: { 
      opacity: 0,
      y: 40,
      rotate: -30
    },
    visible: { 
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  }

  useEffect(() => {
    // Get initial session
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDiscordSignIn() {
    try {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin
            }
        })
        if (error) throw error
    } catch (error) {
        alert(error.message)
    } finally {
        setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Welcome, {user.email}</h2>
        <div className="mt-4">
          <p>User ID: {user.id}</p>
          <p>Last Sign In: {user.last_sign_in_at}</p>
          <button
            className="btn btn-error mt-4"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F3' }}>
      <div className="card w-96 shadow-lg" style={{ backgroundColor: '#B5E2FA' }}>
        <div className="card-body items-center text-center p-6">
          <motion.div
            className="card-title text-5xl font-black font-mono tracking-tight"
            style={{ color: '#0FA3B1' }}
            initial="hidden"
            animate="visible"
            variants={titleVariants}
          >
            {"Portion".split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block"
                style={{ marginRight: '-0.07em' }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
          <div className="form-control w-full">
            <div className="divider mt-0"></div>
            <button
              onClick={handleGoogleSignIn}
              className="btn w-full gap-2 transition-colors duration-200 hover:!bg-[#EDDEA4]"
              style={{ 
                backgroundColor: '#F9F7F3',
                color: '#0FA3B1',
                borderColor: '#0FA3B1'
              }}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style={{ fill: '#0FA3B1' }} viewBox="0 0 16 16">
                <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
              </svg>
              Sign in with Google
            </button>
            <button
              onClick={handleDiscordSignIn}
              className="btn w-full gap-2 mt-2 transition-colors duration-200 hover:!bg-[#EDDEA4]"
              style={{ 
                backgroundColor: '#F9F7F3',
                color: '#0FA3B1',
                borderColor: '#0FA3B1'
              }}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style={{ fill: '#0FA3B1' }} viewBox="0 0 16 16">
                <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
              </svg>
              Sign in with Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 