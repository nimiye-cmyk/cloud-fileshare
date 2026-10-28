'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FrontPage() {
  const [dragActive, setDragActive] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const uploadCollectionRef = collection(db, 'upload');
    const q = query(uploadCollectionRef, orderBy('createdAt', 'desc'), limit(4));

    const unsubscribeFiles = onSnapshot(q, (snapshot) => {
      const filesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentFiles(filesList);
      setLoadingFiles(false);
    }, (error) => {
      console.error("Error subscribing to upload collection: ", error);
      setLoadingFiles(false);
    });

    return () => unsubscribeFiles();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsModalOpen(true);
    }
  };

  const executeUpload = async () => {
    if (!selectedFile) return;
    setUploadStatus('uploading');

    try {
      const targetUid = currentUser ? currentUser.uid : "anonymous_user";

      // DIRECT FIRESTORE WRITE ONLY - NO SERVER STORAGE INVOLVED
      await addDoc(collection(db, 'upload'), {
        userId: targetUid,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        createdAt: serverTimestamp(),
        starred: false,
        isPublic: true,
        note: "Metadata only saved locally to collection"
      });

      setUploadStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedFile(null);
        setUploadStatus('');
      }, 1500);

    } catch (writeErr) {
      console.error("Firestore pure metadata log entry error:", writeErr);
      setUploadStatus('error');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileExtensionTag = (filename) => {
    if (!filename) return 'FILE';
    const ext = filename.split('.').pop().toUpperCase();
    return ext.length > 4 ? 'FILE' : ext;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            ✨ Metadata Registry Pipeline
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Firestore Only <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              No Server Storage
            </span>
          </h1>
          <p className="text-base text-slate-400 max-w-xl mx-auto lg:mx-0">
            Log metadata info profiles straight into your secure data array collections without consuming external asset bucket space.
          </p>
        </div>

        <div className="lg:col-span-6 w-full max-w-xl mx-auto">
          <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('hero-file-picker')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input 
                type="file" 
                id="hero-file-picker" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setIsModalOpen(true);
                    setUploadStatus('');
                  }
                }}
              />
              <p className="text-sm font-medium text-slate-200">Drop files here to extract metadata, or <span className="text-blue-400">browse</span></p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Firestore Collection Logs</p>
              {loadingFiles ? (
                <div className="text-center py-4 text-xs text-slate-500 animate-pulse">Syncing collections...</div>
              ) : recentFiles.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-600 italic">No document metrics listed yet.</div>
              ) : (
                recentFiles.map((fileNode) => (
                  <div key={fileNode.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-blue-400 bg-blue-500/10 p-2 rounded-lg text-xs font-black min-w-[42px] text-center">
                        {getFileExtensionTag(fileNode.fileName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-200 truncate">{fileNode.fileName}</p>
                        <p className="text-[10px] text-slate-500">{formatSize(fileNode.fileSize)} • Firestore Registry</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-md">Register Document Log</h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <p className="font-medium text-slate-200 truncate">{selectedFile.name}</p>
              <p className="text-slate-500 mt-1">{formatSize(selectedFile.size)} ({selectedFile.type || 'unknown type'})</p>
            </div>
            
            {uploadStatus === 'uploading' && <p className="text-xs text-center text-blue-400 animate-pulse">Saving to Firestore...</p>}
            {uploadStatus === 'success' && <p className="text-xs text-center text-emerald-400 font-medium">🎉 Metadata Logged Successfully!</p>}
            {uploadStatus === 'error' && <p className="text-xs text-center text-rose-400 font-medium">⚠️ Firestore Submission Fault.</p>}
            
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsModalOpen(false)} disabled={uploadStatus === 'uploading'} className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 text-xs py-2.5 rounded-xl">Cancel</button>
              <button onClick={executeUpload} disabled={uploadStatus === 'uploading'} className="flex-1 bg-blue-600 text-white font-medium text-xs py-2.5 rounded-xl">Save Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
