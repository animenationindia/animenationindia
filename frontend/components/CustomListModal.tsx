'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, X, FolderPlus, ListPlus, Loader2 } from 'lucide-react';

interface CustomListModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: {
    mal_id: number;
    title: string;
    image: string;
    format?: string;
    score?: number;
  };
}

interface CustomList {
  _id: string;
  name: string;
  description: string;
  items: Array<{ mal_id: number }>;
}

export default function CustomListModal({ isOpen, onClose, anime }: CustomListModalProps) {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchLists = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    if (!token || !userId) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/lists/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch {
      console.error('Failed to fetch custom lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItemInList = async (list: CustomList) => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const isAlreadyInList = list.items.some((i) => i.mal_id === anime.mal_id);

    try {
      if (isAlreadyInList) {
        // Remove
        const res = await fetch(`${backendUrl}/api/lists/${list._id}/items/${anime.mal_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMessage(`Removed from ${list.name}`);
          setLists((prev) =>
            prev.map((l) =>
              l._id === list._id
                ? { ...l, items: l.items.filter((i) => i.mal_id !== anime.mal_id) }
                : l
            )
          );
        }
      } else {
        // Add
        const res = await fetch(`${backendUrl}/api/lists/${list._id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ anime }),
        });
        if (res.ok) {
          setMessage(`Added to ${list.name}!`);
          setLists((prev) =>
            prev.map((l) =>
              l._id === list._id
                ? { ...l, items: [...l.items, { mal_id: anime.mal_id }] }
                : l
            )
          );
        }
      }
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage('Error updating list');
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!newListName.trim() || !token) return;

    setCreating(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDesc.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const createdList = data.list;

        // Auto-add current anime to this new list
        await fetch(`${backendUrl}/api/lists/${createdList._id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ anime }),
        });

        createdList.items = [{ mal_id: anime.mal_id }];
        setLists((prev) => [createdList, ...prev]);
        setNewListName('');
        setNewListDesc('');
        setShowCreateForm(false);
        setMessage(`Created and added to ${createdList.name}!`);
        setTimeout(() => setMessage(null), 2500);
      }
    } catch {
      setMessage('Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e0f1d] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2]">
            <ListPlus size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add to Animenation List</h3>
            <p className="text-xs text-gray-400 truncate max-w-[260px]">{anime.title}</p>
          </div>
        </div>

        {/* Notification Message */}
        {message && (
          <div className="mb-4 text-xs font-bold py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex items-center gap-2">
            <Check size={14} />
            {message}
          </div>
        )}

        {!isLoggedIn ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-4">Please log in to manage your custom lists.</p>
            <button
              onClick={onClose}
              className="bg-[#ff4dd2] text-black font-extrabold px-6 py-2 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* List Selection Grid */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-4 custom-scrollbar">
              {loading ? (
                <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin text-[#ff4dd2]" /> Loading lists...
                </div>
              ) : lists.length === 0 && !showCreateForm ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No custom lists found. Create your first list below!
                </div>
              ) : (
                lists.map((list) => {
                  const isInList = list.items.some((i) => i.mal_id === anime.mal_id);
                  return (
                    <button
                      key={list._id}
                      onClick={() => toggleItemInList(list)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                        isInList
                          ? 'bg-[#ff4dd2]/10 border-[#ff4dd2]/50 text-white shadow-md shadow-[#ff4dd2]/10'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-bold truncate">{list.name}</p>
                        {list.description && (
                          <p className="text-[11px] text-gray-400 truncate">{list.description}</p>
                        )}
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          {list.items.length} items
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          isInList
                            ? 'bg-[#ff4dd2] border-[#ff4dd2] text-black'
                            : 'border-white/20 bg-black/40'
                        }`}
                      >
                        {isInList && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create New List Accordion Form */}
            {showCreateForm ? (
              <form
                onSubmit={handleCreateList}
                className="bg-[#15162c] border border-white/10 rounded-2xl p-4 mb-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FolderPlus size={14} className="text-[#ff4dd2]" /> Create a list
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      List name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My Top 10 Shonen"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="What is this list about?"
                      rows={2}
                      value={newListDesc}
                      onChange={(e) => setNewListDesc(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating || !newListName.trim()}
                    className="w-full bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    Create and Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-bold text-[#ff4dd2] hover:text-white transition-all mb-4 cursor-pointer"
              >
                <Plus size={16} /> + New list
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
