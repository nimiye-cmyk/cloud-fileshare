'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ photoUrl: '', initialLetters: '..' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        let displayName = currentUser.displayName || 'Cloud User';
        let photoUrl = currentUser.photoURL || '';
        
        const parts = displayName.trim().split(' ');
        const initialLetters = parts.length >= 2 
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : displayName.slice(0, 2).toUpperCase();

        setProfile({ photoUrl, initialLetters });

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUserDoc = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            let finalName = data.fullName || data.name || displayName;
            const updatedParts = finalName.trim().split(' ');
            const updatedInitials = updatedParts.length >= 2 
              ? (updatedParts[0][0] + updatedParts[1][0]).toUpperCase()
              : finalName.slice(0, 2).toUpperCase();

            setProfile({
              photoUrl: data.photoUrl || photoUrl,
              initialLetters: updatedInitials
            });
          }
        }, (error) => {
          console.error("Navbar profile snapshot error:", error);
        });

        return () => unsubscribeUserDoc();
      } else {
        setUser(null);
        setProfile({ photoUrl: '', initialLetters: '..' });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      setIsOpen(false);
      router.push('/auth/signin');
    } catch (err) {
      console.error("Sign out process exception handler failure:", err);
    }
  };

  return (
    <nav className="sticky top-0 w-full bg-slate-950/60 backdrop-blur-xl border-b border-slate-900/80 z-50 selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Side: Logo only */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform transition group-hover:scale-105 duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5 5 0 00-4.591-2.941A1 1 0 0010 7v3.586L8.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 10.586V5a3 3 0 116 0v1a5 5 0 011 9.9M4.582 9m0 0H9m-4.418 0a2 2 0 112.836-2.836" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Cloud File Share
              </span>
            </Link>
          </div>

          {/* Right Side: Everything grouped closely together on the right hand side */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* Action Grouping Container */}
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800/60 rounded-xl p-1.5 backdrop-blur-sm">
              <Link href="/dashboard" className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all duration-150">
                Dashboard
              </Link>
              
              {/* Internal Inline Splitter */}
              <div className="h-4 w-px bg-slate-800 mx-1" />

              {user ? (
                /* Profile Dropdown Trigger when signed in */
                <div className="relative px-2" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center focus:outline-none cursor-pointer select-none"
                  >
                    {profile.photoUrl ? (
                      <img src={profile.photoUrl} alt="User Avatar Profile" className="w-8 h-8 rounded-full object-cover border border-slate-800 shadow-md shrink-0 hover:border-slate-700 transition-colors" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 flex items-center justify-center font-bold text-[10px] tracking-wider text-blue-400 border border-blue-500/30 shadow-sm shrink-0 hover:border-blue-500/50 transition-colors">
                        {profile.initialLetters}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Container Element Panel */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Login Actions group when unauthenticated */
                <>
                  <Link href="/auth/login" className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-all duration-150">
                    Log In
                  </Link>
                  <Link href="/auth/signin" className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-md shadow-blue-600/10 transition-all duration-150">
                    Sign In
                  </Link>
                </>
              )}
            </div>

          </div>

          {/* Mobile Menu Hamburger Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition-colors duration-200"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Slide Drawer */}
      <div className={`md:hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`} id="mobile-menu">
        <div className="px-3 pt-2 pb-4 space-y-1 bg-slate-950 border-t border-slate-900/60 shadow-xl">
          <Link href="#features" onClick={() => setIsOpen(false)} className="block text-base font-medium text-slate-400 hover:text-white hover:bg-slate-900/50 px-3 py-2.5 rounded-xl transition-colors">
            Features
          </Link>
          <Link href="#pricing" onClick={() => setIsOpen(false)} className="block text-base font-medium text-slate-400 hover:text-white hover:bg-slate-900/50 px-3 py-2.5 rounded-xl transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block text-base font-medium text-slate-400 hover:text-white hover:bg-slate-900/50 px-3 py-2.5 rounded-xl transition-colors">
            Dashboard
          </Link>
          
          <div className="pt-4 pb-2 border-t border-slate-900 flex flex-col gap-2 px-3">
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full text-center text-sm font-medium bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Log Out
              </button>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setIsOpen(false)} className="w-full text-center text-sm font-medium text-slate-400 hover:text-white py-2.5 rounded-xl transition-colors">
                  Log In
                </Link>
                <Link href="/auth/signin" onClick={() => setIsOpen(false)} className="w-full text-center text-sm font-medium bg-blue-600 text-white py-2.5 rounded-xl shadow-md transition-colors">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
