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

export default function DashboardPage() {
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

      // Uploads directly to 'upload' collection, bypasses server binary storage
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
      // Deletes document metadata only from firestore data collection
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
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 flex relative overflow-hidden"
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
            <button onClick={() => { setActiveMenu('files'); setActiveFilter('all'); }} className={`w-full flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeMenu === 'files' && activeFilter === 'all' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
              <span>📁</span> My Files
            </button>
            <button onClick={() => { setActiveMenu('starred'); setActiveFilter('all'); }} className={`w-full flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeMenu === 'starred' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
              <span>⭐</span> Starred
            </button>
            <button onClick={() => { setActiveMenu('files'); setActiveFilter('shared'); }} className={`w-full flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeFilter === 'shared' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
              <span>🔗</span> Shared Links
            </button>
            <div className="pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-4">Categories</div>
            <button onClick={() => { setActiveMenu('files'); setActiveFilter('images'); }} className={`w-full flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeFilter === 'images' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
              <span>🖼️</span> Images
            </button>
            <button onClick={() => { setActiveMenu('files'); setActiveFilter('pdfs'); }} className={`w-full flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all ${activeFilter === 'pdfs' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}>
              <span>📄</span> PDFs
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3">
            {userProfile.photoUrl ? (
              <img src={userProfile.photoUrl} alt="Profile picture" className="w-10 h-10 rounded-full object-cover border border-slate-800 shadow-md shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 flex items-center justify-center font-bold text-xs tracking-wider text-blue-400 border border-blue-500/30 shadow-sm shrink-0">
                {userProfile.initialLetters}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white leading-tight truncate">{userProfile.name}</h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{userProfile.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-400">
              <span>🔍 Storage Allocation</span>
              <span className="text-slate-300">{formatGB(userProfile.usedStorageBytes)} GB of {formatGB(userProfile.maxStorageBytes)} GB</span>
            </div>
            <div className="w-full bg-slate-950 border border-slate-900 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300" style={{ width: `${storagePercentage}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { setIsPublic(false); setIsUploadModalOpen(true); setUploadStatus(''); }}
              className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xl cursor-pointer select-none active:scale-[0.98] transition-all"
            >
              ➕ Upload File
            </button>
            <button onClick={async () => { await signOut(auth); router.push('/auth/login'); }} className="px-3 border border-slate-800 hover:bg-slate-900/60 rounded-xl text-xs text-slate-400 hover:text-rose-400 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto z-10 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight capitalize">My Files</h2>
            <p className="text-xs text-slate-500 mt-0.5">Home / All Files</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input 
                type="text" 
                placeholder="Search filtered workspace..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-0.5 flex">
              <button onClick={() => setIsGrid(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Grid</button>
              <button onClick={() => setIsGrid(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!isGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>List</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl flex items-center gap-4">
            <span className="text-2xl bg-blue-500/10 p-3 rounded-lg text-blue-400">📄</span>
            <div>
              <h3 className="text-xl font-bold text-white">{totalFilesCount}</h3>
              <p className="text-xs text-slate-500 font-medium">Total Files</p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl flex items-center gap-4">
            <span className="text-2xl bg-amber-500/10 p-3 rounded-lg text-amber-400">⭐</span>
            <div>
              <h3 className="text-xl font-bold text-white">{starredFilesCount}</h3>
              <p className="text-xs text-slate-500 font-medium">Starred items</p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl flex items-center gap-4">
            <span className="text-2xl bg-teal-500/10 p-3 rounded-lg text-teal-400">🔗</span>
            <div>
              <h3 className="text-xl font-bold text-white">{sharedPublicCount}</h3>
              <p className="text-xs text-slate-500 font-medium">Shared Links</p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl flex items-center gap-4">
            <span className="text-2xl bg-purple-500/10 p-3 rounded-lg text-purple-400">☁</span>
            <div>
              <h3 className="text-xl font-bold text-white">{formatGB(userProfile.usedStorageBytes)} GB</h3>
              <p className="text-xs text-slate-500 font-medium">Used Space</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => { setIsPublic(false); setUploadStatus(''); setIsUploadModalOpen(true); }}
          className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/10 rounded-2xl p-10 text-center mb-8 cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
        >
          <span className="text-3xl">☁</span>
          <h4 className="text-sm font-semibold text-slate-300">Drag & drop files here</h4>
          <p className="text-xs text-slate-500">or click to browse from your computer</p>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-900/10 border border-dashed border-slate-900 rounded-2xl">
            <span className="text-3xl mb-3">📂</span>
            <h4 className="text-sm font-semibold text-slate-300">No items located</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">No uploaded materials inside this filter criteria match your guidelines.</p>
          </div>
        ) : isGrid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between group transition-all hover:shadow-xl relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-center text-lg shadow-sm">
                    {getFileBadge(file.fileType, file.fileName)}
                  </div>
                  <div className="flex items-center gap-1">
                    {file.isPublic && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/10 mr-1">Public</span>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleStar(file)}
                        className={`p-1.5 border border-slate-800 rounded-lg text-xs transition-all hover:bg-slate-950 ${file.starred ? 'text-amber-400' : 'text-slate-500'}`}
                      >
                        ★
                      </button>
                      <button 
                        disabled={isDeletingId === file.id}
                        onClick={() => handleDeleteFile(file)}
                        className="p-1.5 border border-slate-800 hover:bg-slate-950 rounded-lg text-xs text-slate-500 hover:text-rose-400 transition-all"
                      >
                        {isDeletingId === file.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate" title={file.fileName}>{file.fileName}</h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>{formatBytes(file.fileSize)}</span>
                    {file.downloadUrl && (
                      <a href={file.downloadUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium">Download</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-medium">
                  <th className="p-3">File Asset Name</th>
                  <th className="p-3">Size Dimensions</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Privacy Pass</th>
                  <th className="p-3 text-right">Actions Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="p-3 text-white font-medium max-w-xs truncate flex items-center gap-2">
                      <button onClick={() => handleToggleStar(file)} className={`text-sm ${file.starred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}>
                        {file.starred ? '★' : '☆'}
                      </button>
                      <span className="mr-1">{getFileBadge(file.fileType, file.fileName)}</span>
                      <span className="truncate">{file.fileName}</span>
                    </td>
                    <td className="p-3 text-slate-400">{formatBytes(file.fileSize)}</td>
                    <td className="p-3 text-slate-500 uppercase">{file.fileType ? file.fileType.split('/')[1] || file.fileType : 'Unknown'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${file.isPublic ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-slate-800 text-slate-400'}`}>
                        {file.isPublic ? 'Shared Public' : 'Private Only'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-3">
                      {file.downloadUrl && (
                        <a href={file.downloadUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium">Download</a>
                      )}
                      <button 
                        disabled={isDeletingId === file.id}
                        onClick={() => handleDeleteFile(file)}
                        className="text-slate-500 hover:text-rose-400 font-medium disabled:opacity-50"
                      >
                        {isDeletingId === file.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-md text-white">Upload Files</h3>
              {uploadStatus !== 'uploading' && (
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white text-md font-bold">×</button>
              )}
            </div>

            {uploadStatus === '' && (
              <div className="space-y-5">
                <div 
                  onClick={() => document.getElementById('modal-file-picker')?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/40 rounded-xl p-8 text-center cursor-pointer transition-colors"
                >
                  <input 
                    type="file" 
                    id="modal-file-picker" 
                    className="hidden" 
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processAndUploadFile(e.target.files);
                      }
                    }} 
                  />
                  <span className="text-3xl block mb-2">☁</span>
                  <p className="text-xs font-semibold text-slate-300">Select files to upload</p>
                  <p className="text-[11px] text-slate-500 mt-1">You can select multiple files</p>
                </div>

                <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Public Links Allocation</span>
                    <span className="text-[10px] text-slate-500">Allow users to read this asset without verification headers.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Saving metadata to collection...</span>
                  <span className="font-semibold text-blue-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-blue-500 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl text-center font-medium">
                🎉 File metadata recorded successfully!
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl text-center font-medium">
                ⚠️ Operation failed. Verify your database configuration settings.
              </div>
            )}
            
            {uploadStatus !== 'uploading' && (
              <div className="flex justify-end pt-2">
                <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 border border-slate-800 text-slate-400 text-xs rounded-xl hover:bg-slate-900 transition-colors">Cancel Upload</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
