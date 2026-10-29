'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

export default function DashboardClient() {
  const [isGrid, setIsGrid] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [activeMenu, setActiveMenu] = useState('files'); 
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [isPublic, setIsPublic] = useState(false);
  
  // Controls if sidebar drawer slides over the mobile view screen canvas area
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [userProfile, setUserProfile] = useState({ 
    name: 'Loading...', 
    email: '', 
    photoUrl: '', 
    initialLetters: '..',
    maxStorageBytes: 16106127360, 
    usedStorageBytes: 0
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); 
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setCurrentUserId(currentUser.uid);
      let displayName = currentUser.displayName || 'Cloud User';
      let photoUrl = currentUser.photoURL || '';
      let maxStorageBytes = 16106127360; 

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          if (data.fullName) displayName = data.fullName;
          if (data.name) displayName = data.name;
          if (data.photoUrl) photoUrl = data.photoUrl;
          if (typeof data.maxStorageBytes === 'number') maxStorageBytes = data.maxStorageBytes;
        }
      } catch (e) {
        console.error('Error gathering user data:', e);
      }

      const parts = displayName.trim().split(' ');
      const initialLetters = parts.length >= 2 
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : displayName.slice(0, 2).toUpperCase();

      const userRef = doc(db, 'users', currentUser.uid);
      const unsubscribeUserDoc = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile({
            name: displayName,
            email: currentUser.email || '',
            photoUrl,
            initialLetters,
            maxStorageBytes: data.maxStorageBytes || maxStorageBytes,
            usedStorageBytes: data.usedStorageBytes || 0
          });
        }
      });

      const filesQuery = query(
        collection(db, 'upload'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
        const structuralFiles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        structuralFiles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFiles(structuralFiles);
      });

      return () => {
        unsubscribeUserDoc();
        unsubscribeFiles();
      };
    });

    return () => unsubscribeAuth();
  }, [router]);

  const processAndUploadFile = async (fileInput) => {
    let file = fileInput instanceof FileList ? fileInput[0] : fileInput;
    if (!file || !currentUserId) return;

    setUploadStatus('uploading');
    setUploadProgress(40);
    setIsUploadModalOpen(true);

    try {
      await addDoc(collection(db, 'upload'), {
        userId: currentUserId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        createdAt: serverTimestamp(),
        starred: false,
        isPublic: isPublic 
      });

      setUploadProgress(100);
      setUploadStatus('success');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus('');
      }, 1500);

    } catch (err) {
      setUploadStatus('error');
    }
  };

  const handleToggleStar = async (fileObj) => {
    try {
      await updateDoc(doc(db, 'upload', fileObj.id), { starred: !fileObj.starred });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (fileObj) => {
    if (!confirm(`Delete "${fileObj.fileName}"?`)) return;
    setIsDeletingId(fileObj.id);
    try {
      await deleteDoc(doc(db, 'upload', fileObj.id));
    } catch (err) {
      alert("Removal failed.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(1);
  const storagePercentage = Math.min(100, ((userProfile.usedStorageBytes / userProfile.maxStorageBytes) * 100) || 0);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeMenu === 'starred') return file.starred === true;
    if (activeFilter === 'shared') return file.isPublic === true;
    if (activeFilter === 'images') return file.fileType.startsWith('image/');
    if (activeFilter === 'pdfs') return file.fileType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
    return true; 
  });

  return (
    // 📱 LAYOUT FLUIDITY FIX: Removed global forced min-width block so layout maps natively down to phones
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row relative overflow-x-hidden">
      
      {/* Mobile Drawer Backdrop overlay screen mask component */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* 📱 MODERN NATIVE MOBILE TOGGLE SIDEBAR DRAWER INTERFACE */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/90 md:bg-slate-900/40 backdrop-blur-xl border-r border-slate-900/80 flex flex-col justify-between p-6 z-50 transition-transform duration-300 md:translate-x-0 shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">☁</span>
              <span className="text-sm font-bold tracking-tight text-white">Cloud File Share</span>
            </div>
            {/* Mobile close toggle cross button */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 text-lg p-1">✕</button>
          </div>

          <nav className="space-y-1">
            <button onClick={() => { setActiveMenu('files'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeMenu === 'files' && activeFilter === 'all' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>📁</span> My Files ({files.length})
            </button>
            <button onClick={() => { setActiveMenu('starred'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeMenu === 'starred' ? 'bg-amber-600/10 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <span>⭐</span> Starred ({files.filter(f => f.starred).length})
            </button>
          </nav>

          <div className="space-y-1 pt-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4">Filters</h3>
            <button onClick={() => { setActiveFilter('images'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs ${activeFilter === 'images' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-400'}`}>🖼️ Images</button>
            <button onClick={() => { setActiveFilter('pdfs'); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs ${activeFilter === 'pdfs' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-400'}`}>📕 PDFs</button>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-800/80 pt-4">
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${storagePercentage}%` }} />
          </div>
          <p className="text-[11px] text-slate-500">{userProfile.email}</p>
          <button onClick={() => signOut(auth)} className="w-full bg-slate-950 border border-slate-800 text-xs py-2 rounded-xl text-rose-400">Sign Out</button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col w-full">
        
        {/* Mobile Header Bar showcasing the menu slide arrow trigger button */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-400 text-lg p-1"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-slate-100">Dashboard</h1>
          <div className="w-6" />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upload Button */}
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm transition-colors">
            Upload File
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => processAndUploadFile(e.target.files)}
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-blue-500"
            />
            Make Public
          </label>
        </div>

        {/* Files Display Area */}
        <div className={`grid ${isGrid ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
          {filteredFiles.map(file => (
            <div key={file.id} className="bg-slate-900 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100 truncate">{file.fileName}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.fileSize)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button 
                  onClick={() => handleToggleStar(file)}
                  className={`text-sm ${file.starred ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
                >
                  {file.starred ? '★ Starred' : '☆ Star'}
                </button>
                <button 
                  onClick={() => handleDeleteFile(file)}
                  className={`text-sm ${isDeletingId === file.id ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
                >
                  {isDeletingId === file.id ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Progress Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 p-6 rounded-xl w-80 text-center">
              <p className="text-sm text-slate-100 mb-4">
                {uploadStatus === 'uploading' && 'Uploading...'}
                {uploadStatus === 'success' && 'Upload Successful!'}
                {uploadStatus === 'error' && 'Upload Failed!'}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full ${uploadStatus === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}