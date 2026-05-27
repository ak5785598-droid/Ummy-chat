import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, limit, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Loader, Trash2, Edit2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FrameConfig {
  videoUrl: string;
  imageUrl: string;
  type: 'video' | 'image';
  isEnabled: boolean;
}

export interface LeaderboardThemeConfig {
  id?: string;
  name: string;
  backgroundUrl: string;
  backgroundType: 'image' | 'video';
  isActive: boolean;
  frameConfigs: {
    rank1: FrameConfig;
    rank2: FrameConfig;
    rank3: FrameConfig;
    top: FrameConfig;
  };
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

export interface LeaderboardThemeFormData extends Omit<LeaderboardThemeConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  id?: string;
}

const defaultFrameConfig: FrameConfig = {
  videoUrl: '',
  imageUrl: '',
  type: 'image',
  isEnabled: false
};

const defaultThemeConfig: LeaderboardThemeFormData = {
  name: '',
  backgroundUrl: '',
  backgroundType: 'image',
  isActive: false,
  frameConfigs: {
    rank1: { ...defaultFrameConfig },
    rank2: { ...defaultFrameConfig },
    rank3: { ...defaultFrameConfig },
    top: { ...defaultFrameConfig }
  }
};

export function LeaderboardThemeAdmin() {
  const firestore = useFirestore();
  const [formData, setFormData] = useState<LeaderboardThemeFormData>(defaultThemeConfig);
  const [themes, setThemes] = useState<LeaderboardThemeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Fetch all themes
  useEffect(() => {
    if (!firestore) return;

    const fetchThemes = async () => {
      try {
        const q = query(collection(firestore, 'leaderboardThemes'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeaderboardThemeConfig[];
        setThemes(data);
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };

    fetchThemes();
  }, [firestore]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === 'backgroundUrl' && formData.backgroundType === 'image') {
      setImagePreview(value);
    }
  };

  const handleFrameChange = (rank: 'rank1' | 'rank2' | 'rank3' | 'top', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      frameConfigs: {
        ...prev.frameConfigs,
        [rank]: {
          ...prev.frameConfigs[rank],
          [field]: value
        }
      }
    }));
  };

  const handleCreateTheme = async () => {
    if (!firestore || !formData.name || !formData.backgroundUrl) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        // Update existing theme
        const themeRef = doc(firestore, 'leaderboardThemes', editingId);
        await updateDoc(themeRef, {
          ...formData,
          updatedAt: Date.now()
        });
        alert('Theme updated successfully!');
      } else {
        // Create new theme
        await addDoc(collection(firestore, 'leaderboardThemes'), {
          ...formData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        alert('Theme created successfully!');
      }

      setFormData(defaultThemeConfig);
      setEditingId(null);
      setShowForm(false);

      // Refresh themes list
      const q = query(collection(firestore, 'leaderboardThemes'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardThemeConfig[];
      setThemes(data);
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Error saving theme');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    if (!firestore) return;

    setIsLoading(true);
    try {
      // Deactivate all themes
      const q = query(collection(firestore, 'leaderboardThemes'), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      for (const docSnapshot of snapshot.docs) {
        await updateDoc(doc(firestore, 'leaderboardThemes', docSnapshot.id), {
          isActive: false
        });
      }

      // Activate selected theme
      const themeRef = doc(firestore, 'leaderboardThemes', themeId);
      await updateDoc(themeRef, {
        isActive: true,
        updatedAt: Date.now()
      });

      // Refresh themes list
      const q2 = query(collection(firestore, 'leaderboardThemes'));
      const snapshot2 = await getDocs(q2);
      const data = snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardThemeConfig[];
      setThemes(data);

      alert('Theme activated successfully!');
    } catch (error) {
      console.error('Error activating theme:', error);
      alert('Error activating theme');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!firestore || !window.confirm('Are you sure you want to delete this theme?')) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(firestore, 'leaderboardThemes', themeId));

      // Refresh themes list
      const q = query(collection(firestore, 'leaderboardThemes'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardThemeConfig[];
      setThemes(data);

      alert('Theme deleted successfully!');
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Error deleting theme');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTheme = (theme: LeaderboardThemeConfig) => {
    setFormData({
      name: theme.name,
      backgroundUrl: theme.backgroundUrl,
      backgroundType: theme.backgroundType,
      isActive: theme.isActive,
      frameConfigs: theme.frameConfigs
    });
    setEditingId(theme.id!);
    setShowForm(true);
    setImagePreview(theme.backgroundUrl);
  };

  const handleCancel = () => {
    setFormData(defaultThemeConfig);
    setEditingId(null);
    setShowForm(false);
    setImagePreview('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-[#D4AF37]">Leaderboard Theme Manager</h1>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-slate-900 border border-[#D4AF37]/30 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-black mb-6 text-[#D4AF37]">
              {editingId ? 'Edit Theme' : 'Create New Theme'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#D4AF37] mb-2">Theme Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Golden Royal"
                    className="w-full bg-slate-800 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#D4AF37] mb-2">Background URL *</label>
                  <input
                    type="text"
                    value={formData.backgroundUrl}
                    onChange={(e) => handleInputChange('backgroundUrl', e.target.value)}
                    placeholder="https://cdn.example.com/background.jpg"
                    className="w-full bg-slate-800 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#D4AF37] mb-2">Background Type</label>
                  <select
                    value={formData.backgroundType}
                    onChange={(e) => handleInputChange('backgroundType', e.target.value)}
                    className="w-full bg-slate-800 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="image">Image (JPG, PNG, GIF)</option>
                    <option value="video">Video (MP4, WebM)</option>
                  </select>
                </div>
              </div>

              {/* Background Preview */}
              {imagePreview && formData.backgroundType === 'image' && (
                <div>
                  <label className="block text-sm font-bold text-[#D4AF37] mb-2">Preview</label>
                  <img
                    src={imagePreview}
                    alt="Background preview"
                    className="w-full h-48 object-cover rounded border border-white/20"
                  />
                </div>
              )}
            </div>

            {/* Frame Configurations */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4">Rank Frame Overlays</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(['rank1', 'rank2', 'rank3', 'top'] as const).map((rank) => (
                  <div key={rank} className="bg-slate-800 border border-white/10 rounded p-4">
                    <h4 className="font-bold text-[#D4AF37] mb-3 capitalize">
                      {rank === 'rank1' ? '🥇 Rank 1 (Gold)' : rank === 'rank2' ? '🥈 Rank 2 (Silver)' : rank === 'rank3' ? '🥉 Rank 3 (Bronze)' : '⭐ Top 4+ Players'}
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={formData.frameConfigs[rank].isEnabled}
                          onChange={(e) => handleFrameChange(rank, 'isEnabled', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-white">Enable Frame</span>
                      </label>

                      <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Frame Type</label>
                        <select
                          value={formData.frameConfigs[rank].type}
                          onChange={(e) => handleFrameChange(rank, 'type', e.target.value)}
                          disabled={!formData.frameConfigs[rank].isEnabled}
                          className="w-full bg-slate-700 border border-white/20 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                        >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>
                      </div>

                      {formData.frameConfigs[rank].type === 'image' && (
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={formData.frameConfigs[rank].imageUrl}
                            onChange={(e) => handleFrameChange(rank, 'imageUrl', e.target.value)}
                            disabled={!formData.frameConfigs[rank].isEnabled}
                            placeholder="https://cdn.example.com/frame.png"
                            className="w-full bg-slate-700 border border-white/20 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                          />
                        </div>
                      )}

                      {formData.frameConfigs[rank].type === 'video' && (
                        <div>
                          <label className="block text-xs font-bold text-white/60 mb-1">Video URL</label>
                          <input
                            type="text"
                            value={formData.frameConfigs[rank].videoUrl}
                            onChange={(e) => handleFrameChange(rank, 'videoUrl', e.target.value)}
                            disabled={!formData.frameConfigs[rank].isEnabled}
                            placeholder="https://cdn.example.com/frame.mp4"
                            className="w-full bg-slate-700 border border-white/20 rounded px-2 py-1 text-sm text-white disabled:opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-slate-800 border border-white/20 rounded font-bold hover:border-white/40 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTheme}
                disabled={isLoading}
                className="px-6 py-2 bg-[#D4AF37] text-black font-black rounded hover:bg-[#E5C158] transition disabled:opacity-50"
              >
                {isLoading ? <Loader className="animate-spin inline mr-2 h-4 w-4" /> : null}
                {editingId ? 'Update' : 'Create'} Theme
              </button>
            </div>
          </div>
        )}

        {/* Create Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 px-6 py-3 bg-[#D4AF37] text-black font-black rounded hover:bg-[#E5C158] transition"
          >
            + Create New Theme
          </button>
        )}

        {/* All Themes List */}
        <div>
          <h2 className="text-2xl font-black mb-6 text-[#D4AF37]">All Themes ({themes.length})</h2>

          {themes.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <p>No themes created yet. Create your first theme!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={cn(
                    'border rounded-lg p-4 transition',
                    theme.isActive
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                      : 'bg-slate-800 border-white/20 hover:border-[#D4AF37]/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white">{theme.name}</h3>
                      {theme.isActive && (
                        <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/20 px-2 py-1 rounded inline-block mt-1">
                          🔴 ACTIVE
                        </span>
                      )}
                    </div>
                    {theme.isActive && <Check className="h-5 w-5 text-[#D4AF37]" />}
                  </div>

                  <div className="text-xs text-white/60 mb-4">
                    <p>Background: {theme.backgroundType}</p>
                    {theme.updatedAt && (
                      <p>Updated: {new Date(theme.updatedAt).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="flex gap-2 justify-between">
                    {!theme.isActive && (
                      <button
                        onClick={() => handleActivateTheme(theme.id!)}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-[#D4AF37] text-black font-bold rounded text-sm hover:bg-[#E5C158] transition disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTheme(theme)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-slate-700 text-white font-bold rounded text-sm hover:bg-slate-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTheme(theme.id!)}
                      disabled={isLoading}
                      className="px-3 py-2 bg-red-900 text-white font-bold rounded text-sm hover:bg-red-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
