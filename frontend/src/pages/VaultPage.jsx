import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api, useAuth } from '../App';
import { 
  Shield, Plus, Search, FolderOpen, Eye, Copy, Edit, Trash2,
  Lock, Key, Globe, User, ChevronRight, EyeOff, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const FOLDER_TYPES = [
  { value: 'client', label: 'Client', icon: Globe, color: 'text-blue-400' },
  { value: 'internal', label: 'Internal', icon: Lock, color: 'text-purple-400' },
  { value: 'project', label: 'Project', icon: FolderOpen, color: 'text-brand-teal' },
  { value: 'personal', label: 'Personal', icon: User, color: 'text-brand-mint' },
];

const VaultPage = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddCred, setShowAddCred] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  
  const [folderForm, setFolderForm] = useState({
    name: '',
    folder_type: 'client',
    description: ''
  });

  const [credForm, setCredForm] = useState({
    folder_id: '',
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await api.get('/vault/folders');
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async (folderId) => {
    try {
      const response = await api.get(`/vault/folders/${folderId}/credentials`);
      setCredentials(response.data);
    } catch (error) {
      toast.error('Failed to load credentials');
    }
  };

  const handleSelectFolder = async (folder) => {
    setSelectedFolder(folder);
    setCredForm({ ...credForm, folder_id: folder.id });
    setRevealedPasswords({});
    await fetchCredentials(folder.id);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/vault/folders', folderForm);
      toast.success('Folder created successfully');
      setFolders([...folders, response.data]);
      setShowAddFolder(false);
      setFolderForm({ name: '', folder_type: 'client', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create folder');
    }
  };

  const handleCreateCredential = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/vault/credentials', {
        ...credForm,
        folder_id: selectedFolder.id
      });
      toast.success('Credential created successfully');
      setCredentials([...credentials, response.data]);
      setShowAddCred(false);
      setCredForm({ folder_id: selectedFolder?.id || '', name: '', username: '', password: '', url: '', notes: '', expiry_date: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create credential');
    }
  };

  const handleRevealPassword = async (credId) => {
    if (revealedPasswords[credId]) {
      setRevealedPasswords({ ...revealedPasswords, [credId]: null });
      return;
    }
    try {
      const response = await api.post(`/vault/credentials/${credId}/reveal`);
      setRevealedPasswords({ ...revealedPasswords, [credId]: response.data.password });
      toast.success('Password revealed (logged)');
    } catch (error) {
      toast.error('Failed to reveal password');
    }
  };

  const handleCopyPassword = async (credId) => {
    try {
      const response = await api.post(`/vault/credentials/${credId}/reveal`);
      await navigator.clipboard.writeText(response.data.password);
      await api.post(`/vault/credentials/${credId}/copy`);
      toast.success('Password copied to clipboard (logged)');
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const getFolderIcon = (type) => {
    const folderType = FOLDER_TYPES.find(f => f.value === type);
    if (!folderType) return FolderOpen;
    return folderType.icon;
  };

  const getFolderColor = (type) => {
    const folderType = FOLDER_TYPES.find(f => f.value === type);
    return folderType?.color || 'text-text-secondary';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-brand-teal" />
              Credential Vault
            </h1>
            <p className="text-text-secondary mt-1">Securely store and manage credentials</p>
          </div>
          
          {user?.role_level >= 3 && (
            <Dialog open={showAddFolder} onOpenChange={setShowAddFolder}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="add-folder-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-rubik text-white">Create Vault Folder</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreateFolder} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Folder Name</label>
                    <Input
                      value={folderForm.name}
                      onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      placeholder="e.g., Client - Acme Corp"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Folder Type</label>
                    <Select value={folderForm.folder_type} onValueChange={(v) => setFolderForm({...folderForm, folder_type: v})}>
                      <SelectTrigger className="bg-surface-highlight border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        {FOLDER_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Description</label>
                    <textarea
                      value={folderForm.description}
                      onChange={(e) => setFolderForm({...folderForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal outline-none resize-none"
                      rows={2}
                      placeholder="Optional description..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setShowAddFolder(false)}>Cancel</Button>
                    <Button type="submit" className="bg-brand-teal text-black">Create Folder</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Folders Sidebar */}
          <div className="col-span-4 bg-surface border border-white/5 rounded-2xl p-4">
            <h3 className="font-semibold text-white mb-4">Folders</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No folders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map(folder => {
                  const Icon = getFolderIcon(folder.folder_type);
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleSelectFolder(folder)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedFolder?.id === folder.id 
                          ? 'bg-brand-teal/10 border border-brand-teal/30' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      data-testid={`folder-${folder.id}`}
                    >
                      <Icon className={`w-5 h-5 ${getFolderColor(folder.folder_type)}`} />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{folder.name}</p>
                        <p className="text-xs text-text-muted capitalize">{folder.folder_type}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Credentials Area */}
          <div className="col-span-8 bg-surface border border-white/5 rounded-2xl p-6">
            {!selectedFolder ? (
              <div className="flex flex-col items-center justify-center h-96 text-text-secondary">
                <Shield className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">Select a folder to view credentials</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-rubik font-semibold text-white">{selectedFolder.name}</h3>
                    <p className="text-sm text-text-secondary">{credentials.length} credentials</p>
                  </div>
                  
                  {user?.role_level >= 3 && (
                    <Dialog open={showAddCred} onOpenChange={setShowAddCred}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Credential
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-surface border-white/10 max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-rubik text-white">Add Credential</DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateCredential} className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <label className="text-sm text-text-secondary">Name</label>
                            <Input
                              value={credForm.name}
                              onChange={(e) => setCredForm({...credForm, name: e.target.value})}
                              className="bg-surface-highlight border-white/10"
                              placeholder="e.g., Google Ads Account"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-text-secondary">Username / Email</label>
                            <Input
                              value={credForm.username}
                              onChange={(e) => setCredForm({...credForm, username: e.target.value})}
                              className="bg-surface-highlight border-white/10"
                              placeholder="user@example.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-text-secondary">Password</label>
                            <Input
                              type="password"
                              value={credForm.password}
                              onChange={(e) => setCredForm({...credForm, password: e.target.value})}
                              className="bg-surface-highlight border-white/10"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-text-secondary">URL</label>
                            <Input
                              value={credForm.url}
                              onChange={(e) => setCredForm({...credForm, url: e.target.value})}
                              className="bg-surface-highlight border-white/10"
                              placeholder="https://ads.google.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm text-text-secondary">Notes</label>
                            <textarea
                              value={credForm.notes}
                              onChange={(e) => setCredForm({...credForm, notes: e.target.value})}
                              className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal outline-none resize-none"
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setShowAddCred(false)}>Cancel</Button>
                            <Button type="submit" className="bg-brand-teal text-black">Save Credential</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {credentials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                    <Key className="w-12 h-12 mb-4 opacity-30" />
                    <p>No credentials in this folder</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {credentials.map(cred => (
                      <div
                        key={cred.id}
                        className="bg-surface-highlight border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
                        data-testid={`credential-${cred.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white">{cred.name}</h4>
                            {cred.username && (
                              <p className="text-sm text-text-secondary mt-1">{cred.username}</p>
                            )}
                            {cred.url && (
                              <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-teal hover:underline mt-1 block truncate">
                                {cred.url}
                              </a>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRevealPassword(cred.id)}
                              className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors"
                              title={revealedPasswords[cred.id] ? 'Hide password' : 'Reveal password'}
                            >
                              {revealedPasswords[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleCopyPassword(cred.id)}
                              className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors"
                              title="Copy password"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {revealedPasswords[cred.id] && (
                          <div className="mt-3 p-3 bg-black/30 rounded-lg">
                            <p className="font-mono text-sm text-brand-mint break-all">{revealedPasswords[cred.id]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VaultPage;
