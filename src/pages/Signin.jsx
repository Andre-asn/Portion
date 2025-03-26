import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

function BackgroundPattern() {
  const circles = Array(12).fill(null)
  const positions = [
    { x: "5%", y: "10%" },
    { x: "25%", y: "20%" },
    { x: "45%", y: "15%" },
    { x: "65%", y: "25%" },
    { x: "85%", y: "10%" },
    { x: "15%", y: "40%" },
    { x: "35%", y: "50%" },
    { x: "55%", y: "45%" },
    { x: "75%", y: "55%" },
    { x: "25%", y: "75%" },
    { x: "45%", y: "80%" },
    { x: "65%", y: "70%" },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {circles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-24 h-24"
          style={{ 
            left: positions[i].x,
            top: positions[i].y,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-[#0FA3B1] opacity-30" />
          <motion.div
            className="absolute inset-0 rounded-full bg-[#B5E2FA]"
            initial={{ scale: 0.8, opacity: 0.2 }}
            animate={{ 
              scale: [0.8, 1, 0.8],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      ))}
      
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full">
        {[...Array(12)].map((_, i) => (
          <motion.path
            key={i}
            d={[
              "M-200,50 Q200,150 600,50 T1200,150 T1800,50 T2400,150",
              "M-300,800 Q100,700 500,800 T1100,700 T1700,800 T2300,700",
              "M-150,200 Q300,300 700,200 T1300,300 T1900,200 T2500,300",
              "M-400,650 Q0,550 400,650 T1000,550 T1600,650 T2200,550",
              "M-250,350 Q250,450 650,350 T1250,450 T1850,350 T2450,450",
              "M-350,500 Q150,600 550,500 T1150,600 T1750,500 T2350,600",
              "M-200,100 Q300,200 700,100 T1300,200 T1900,100 T2500,200",
              "M-300,750 Q200,650 600,750 T1200,650 T1800,750 T2400,650",
              "M-250,250 Q150,350 550,250 T1150,350 T1750,250 T2350,350",
              "M-150,600 Q250,700 650,600 T1250,700 T1850,600 T2450,700",
              "M-350,400 Q150,300 550,400 T1150,300 T1750,400 T2350,300",
              "M-200,700 Q300,600 700,700 T1300,600 T1900,700 T2500,600"
            ][i]}
            stroke={i % 2 === 0 ? "#0FA3B1" : "#F7A072"}
            strokeWidth="1.7"
            fill="none"
            strokeDasharray="8,8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1,
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.2
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export function Signin() {
  const [loading, setLoading] = useState(false)
  const [activeProvider, setActiveProvider] = useState(null)

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

  const catchphraseVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.8,
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const receiptVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.2,
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
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
          redirectTo: `${window.location.origin}`,
          queryParams: {
            prompt: 'consent'
          }
        }
      })
      if (error) throw error
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)  
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F3]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0FA3B1]"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center gap-16 overflow-hidden" style={{ backgroundColor: '#F9F7F3' }}>
      <BackgroundPattern />
      <div className="card h-screen ml-16 shadow-lg z-10" style={{ backgroundColor: '#B5E2FA' }}>
        <div className="card-body items-center justify-center text-center p-6 h-full">
          <motion.div
            className="card-title text-7xl font-black font-mono tracking-tight"
            style={{ color: '#0FA3B1' }}
            initial="hidden"
            animate="visible"
            variants={titleVariants}
          >
            {"Portion".split("").map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block disable-select"
                style={{ marginRight: '-0.07em' }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
          <div className="form-control w-96">
            <div className="divider before:bg-[#0FA3B1] after:bg-[#0FA3B1] my-4"/>
            <button
              onClick={handleGoogleSignIn}
              className="btn w-full h-20 gap-2 transition-colors duration-200 hover:!bg-[#EDDEA4] relative"
              style={{ 
                backgroundColor: '#F9F7F3',
                color: '#0FA3B1',
                borderColor: '#0FA3B1'
              }}
              disabled={loading}
            >
              {loading && activeProvider === 'google' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0FA3B1]"></div>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" style={{ fill: '#0FA3B1' }} viewBox="0 0 16 16">
                    <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                  </svg>
                  <text className="text-2xl">Sign in With Google</text>
                </>
              )}
            </button>
            <button
              onClick={handleDiscordSignIn}
              className="btn w-full h-20 gap-2 mt-2 transition-colors duration-200 hover:!bg-[#EDDEA4] relative"
              style={{ 
                backgroundColor: '#F9F7F3',
                color: '#0FA3B1',
                borderColor: '#0FA3B1'
              }}
              disabled={loading}
            >
              {loading && activeProvider === 'discord' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0FA3B1]"></div>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" style={{ fill: '#0FA3B1' }} viewBox="0 0 16 16">
                    <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                  </svg>
                  <text className="text-2xl">Sign in With Discord</text>
                </>
              )}
            </button>
          </div>
        </div>
      </div>   
      <motion.div 
        className="absolute top-16 left-138 text-right"
        initial="hidden"
        animate="visible"
        variants={catchphraseVariants}
      >
        <h2 className="text-4xl font-bold" style={{ color: '#0FA3B1' }}>
          Split bills effortlessly,<br/>
          Share moments endlessly
        </h2>
      </motion.div>

      <motion.div
        className="absolute -bottom-32 right-32 transition-all duration-300 hover:-translate-y-2 hover:drop-shadow-lg cursor-pointer"
        initial="hidden"
        animate="visible"
        variants={receiptVariants}
      >
        {/* Track expenses text at top */}
        <motion.div
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-[#0FA3B1] font-semibold text-lg">Track your expenses</p>
          <p className="text-[#0FA3B1]/70 text-sm">Split bills instantly</p>
        </motion.div>

        {/* Phone div */}
        <motion.div
          className="absolute left-[-450px] top-1/4 transform -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
        >
          <svg width="400" height="600" viewBox="-50 -50 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="walletShadow" x="-20" y="-20" width="340" height="540" filterUnits="userSpaceOnUse">
                <feDropShadow dx="2" dy="4" stdDeviation="8" floodOpacity="0.15"/>
              </filter>
            </defs>

            <g transform="translate(50, 50)">
              <g transform="rotate(-10 570 350)">
                <rect x="10" y="40" width="280" height="520" rx="24" fill="#0FA3B1" filter="url(#walletShadow)" />
                <rect x="20" y="50" width="260" height="500" rx="20" fill="#F9F7F3" />
                
                <rect x="30" y="70" width="240" height="60" rx="8" fill="#B5E2FA" fillOpacity="0.3"/>
                <text x="45" y="105" fill="#0FA3B1" fontSize="16" fontWeight="600">Incoming Payments</text>
                
                <g>
                  <rect x="30" y="150" width="240" height="40" rx="6" fill="#EDDEA4" />
                  <text x="45" y="173" fill="#0FA3B1" fontSize="14" fontWeight="500">From: John D.</text>
                  <text x="200" y="173" fill="#0FA3B1" fontSize="14" fontWeight="600">+$25.00</text>
                </g>
                
                <g>
                  <rect x="30" y="200" width="240" height="40" rx="6" fill="#EDDEA4" opacity="0.9" />
                  <text x="45" y="223" fill="#0FA3B1" fontSize="14" fontWeight="500">From: Sarah M.</text>
                  <text x="200" y="223" fill="#0FA3B1" fontSize="14" fontWeight="600">+$32.50</text>
                </g>
                
                <g>
                  <rect x="30" y="250" width="240" height="40" rx="6" fill="#EDDEA4" opacity="0.8" />
                  <text x="45" y="273" fill="#0FA3B1" fontSize="14" fontWeight="500">From: Alex W.</text>
                  <text x="200" y="273" fill="#0FA3B1" fontSize="14" fontWeight="600">+$18.75</text>
                </g>

                <g>
                  <rect x="30" y="300" width="240" height="40" rx="6" fill="#EDDEA4" opacity="0.8" />
                  <text x="45" y="323" fill="#0FA3B1" fontSize="14" fontWeight="500">From: Morgan S.</text>
                  <text x="200" y="323" fill="#0FA3B1" fontSize="14" fontWeight="600">+$15.50</text>
                </g>
                
                <rect x="100" y="60" width="100" height="4" rx="2" fill="#0FA3B1" opacity="0.2"/>
              </g>
            </g>
          </svg>
        </motion.div>

        {/* Money Transfer Animation - simplified */}
        <motion.div
          className="absolute left-[-280px] top-1/2 transform -translate-y-1/2"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-10 w-40 bg-[#EDDEA4] rounded-sm"
              style={{
                transform: 'rotate(-10deg)'
              }}
              initial={{ x: 240, y: 0, opacity: 0 }}
              animate={{ 
                x: 0,
                y: [-20, 20, -20],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
          ))}
        </motion.div>

        <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main receipt background with enhanced shadow */}
          <defs>
            <filter id="shadow" x="-20" y="-20" width="340" height="440" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.1"/>
            </filter>
          </defs>
          <path d="M20 0H280C291.046 0 300 8.95431 300 20V350C300 361.046 291.046 370 280 370H20C8.95431 370 0 361.046 0 350V20C0 8.95431 8.95431 0 20 0Z" fill="#EAE9E6" filter="url(#shadow)"/>
          
          {/* Receipt header with icon */}
          <rect x="30" y="30" width="240" height="30" rx="4" fill="#B5E2FA" fillOpacity="0.3"/>
          <path d="M45 42H50L52 48L54 42H59" stroke="#0FA3B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Receipt lines */}
          <rect x="30" y="80" width="160" height="2" rx="1" fill="#0FA3B1" fillOpacity="0.2"/>
          <rect x="210" y="80" width="60" height="2" rx="1" fill="#F7A072"/>
          
          <rect x="30" y="120" width="140" height="2" rx="1" fill="#0FA3B1" fillOpacity="0.2"/>
          <rect x="190" y="120" width="80" height="2" rx="1" fill="#F7A072"/>
          
          <rect x="30" y="160" width="180" height="2" rx="1" fill="#0FA3B1" fillOpacity="0.2"/>
          <rect x="230" y="160" width="40" height="2" rx="1" fill="#F7A072"/>
          
          {/* Total section with enhanced visibility */}
          <rect x="30" y="220" width="240" height="40" rx="4" fill="#EDDEA4" fillOpacity="0.3"/>
          <text x="45" y="245" fill="#0FA3B1" fontSize="14" fontWeight="500">Total Amount</text>
          <rect x="180" y="235" width="90" height="10" rx="2" fill="#0FA3B1"/>
        </svg>
      </motion.div>
    </div>
  )
} 