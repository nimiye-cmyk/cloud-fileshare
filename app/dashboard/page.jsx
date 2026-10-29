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
  setDoc,
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

export default function DashboardClient() {
  const [isGrid, setIsGrid] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [activeMenu, setActiveMenu] = useState('files'); 
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [isPublic, setIsPublic] = useState(false);

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
        console.error('Error gathering extra user credentials from Firestore:', e);
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
        } else {
          setUserProfile({
            name: displayName,
            email: currentUser.email || '',
            photoUrl,
            initialLetters,
            maxStorageBytes: maxStorageBytes,
            usedStorageBytes: 0
          });
        }
      }, (error) => {
        console.error("User document real-time sync error:", error);
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
      }, (error) => {
        console.error("Real-time files synchronization stream error:", error);
      });

      return () => {
        unsubscribeUserDoc();
        unsubscribeFiles();
      };
    });

    return () => unsubscribeAuth();
  }, [router]);

  const processAndUploadFile = async (fileInput) => {
    let file = null;
    if (fileInput instanceof FileList && fileInput.length > 0) {
      file = fileInput[0]; 
    } else if (fileInput && fileInput.length > 0) {
      file = fileInput[0];
    } else {
      file = fileInput;
    }

    if (!file || !currentUserId) return;

    setUploadStatus('uploading');
    setUploadProgress(50); 
    setIsUploadModalOpen(true);

    try {
      if (!auth.currentUser) {
        throw new Error("Missing authentication context credentials.");
      }

      await addDoc(collection(db, 'upload'), {
        userId: auth.currentUser.uid,
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
        setIsPublic(false); 
      }, 1500);

    } catch (err) {
      console.error("Direct collection metadata save failed:", err);
      setUploadStatus('error');
    }
  };

  const handleToggleStar = async (fileObj) => {
    try {
      const fileDocRef = doc(db, 'upload', fileObj.id);
      await updateDoc(fileDocRef, {
        starred: !fileObj.starred
      });
    } catch (err) {
      console.error("Failed to alter document favorite properties node:", err);
    }
  };

  const handleDeleteFile = async (fileObj) => {
    if (!confirm(`Are you sure you want to permanently delete "${fileObj.fileName}"?`)) return;
    
    setIsDeletingId(fileObj.id);
    try {
      await deleteDoc(doc(db, 'upload', fileObj.id));
    } catch (err) {
      console.error("Failure processing removal request pipeline actions:", err);
      alert("Failed to safely complete document removal processes.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFile(e.dataTransfer.files);
    }
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(1);
  const storagePercentage = Math.min(100, ((userProfile.usedStorageBytes / userProfile.maxStorageBytes) * 100) || 0);

  const totalFilesCount = files.length;
  const starredFilesCount = files.filter(f => f.starred).length;
  const sharedPublicCount = files.filter(f => f.isPublic).length;

  const categorizedFiles = files.filter(file => {
    if (activeMenu === 'starred') return file.starred === true;
    if (activeFilter === 'shared') return file.isPublic === true;
    if (activeFilter === 'images') return file.fileType.startsWith('image/');
    if (activeFilter === 'pdfs') return file.fileType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
    return true; 
  });

  const filteredFiles = categorizedFiles.filter(f => 
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileBadge = (mimeType, name) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return '📕';
    if (name.toLowerCase().endsWith('.zip') || name.toLowerCase().endsWith('.rar')) return '📦';
    return '📄';
  };

  return (
    <div 
      onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 flex relative overflow-x-auto min-w-[1200px]"
    >
      {dragActive && (
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-sm border-4 border-dashed border-blue-500 m-4 rounded-2xl z-50 flex items-center justify-center pointer-events-none">
          <p className="text-xl font-semibold text-blue-400 bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-xl shadow-xl">
            Drop files to initiate file sharing upload sequence
          </p>
        </div>
      )}

      <aside className="w-64 bg-slate-900/40 backdrop-blur-xl border-r border-slate-900/80 flex flex-col justify-between p-6 z-10 shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">☁</span>
            <span className="text-md font-bold tracking-tight text-white">Cloud File Share</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveMenu('files')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${activeMenu === 'files' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
            >
              All Files ({totalFilesCount})
            </button>
            <button
              onClick={() => setActiveMenu('starred')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${activeMenu === 'starred' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
            >
              Starred ({starredFilesCount})
            </button>
          </nav>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Filters</h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                All Files
              </button>
              <button
                onClick={() => setActiveFilter('shared')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${activeFilter === 'shared' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                Shared Public ({sharedPublicCount})
              </button>
              <button
                onClick={() => setActiveFilter('images')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${activeFilter === 'images' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveFilter('pdfs')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${activeFilter === 'pdfs' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                PDFs
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-1">Storage Usage</p>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${storagePercentage}%` }}></div>
            </div>
            <p className="text-xs text-slate-400 mt-1">{formatGB(userProfile.usedStorageBytes)} GB of {formatGB(userProfile.maxStorageBytes)} GB used</p>
          </div>

          <div className="flex items-center gap-3">
            {userProfile.photoUrl ? (
              <img src={userProfile.photoUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {userProfile.initialLetters}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{userProfile.name}</p>
              <p className="text-xs text-slate-400">{userProfile.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut(auth).then(() => router.push('/auth/login'))}
            className="mt-4 w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setIsGrid(!isGrid)}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${isGrid ? 'bg -blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              {isGrid ? 'Grid View' : 'List View'}
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              Upload File
            </button>
          </div>
        </div>

        <div className={`grid ${isGrid ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'flex flex-col gap-4'}`}>
          {filteredFiles.map(file => (
            <div key={file.id} className={`p-4 rounded-lg border ${isGrid ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 flex items-center justify-between'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{getFileBadge(file.fileType, file.fileName)}</span>
                <div>
                  <p className="font-semibold text-white">{file.fileName}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.fileSize)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleToggleStar(file)}
                  className={`px-2 py-1 rounded-lg transition-colors duration-200 ${file.starred ? 'bg-yellow-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                  {file.starred ? '★' : '☆'}
                </button>
                <button
                  onClick={() => handleDeleteFile(file)}
                  disabled={isDeletingId === file.id}
                  className={`px-2 py-1 rounded-lg transition-colors duration-200 ${isDeletingId === file.id ? 'bg-red-700 text-slate-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  {isDeletingId === file.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Upload File</h2>
            <input
              type="file"
              onChange={(e) => processAndUploadFile(e.target.files)}
              className="w-full mb-4"
            />
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                id="publicCheckbox"
              />
              <label htmlFor="publicCheckbox" className="text-sm text-slate-300">Make file public</label>
            </div>
            {uploadStatus === 'uploading' && (
              <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
            {uploadStatus === 'success' && <p className="text-green-500 mb-2">Upload successful!</p>}
            {uploadStatus === 'error' && <p className="text-red-500 mb-2">Upload failed. Please try again.</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}