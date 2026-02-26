import { useState, useEffect, useRef } from "react";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageCircle, Share2, Image as ImageIcon, Plus, Users, Trophy, Calendar } from "lucide-react";

interface Post {
  id: number;
  user_id: number;
  content: string;
  media_url: string | null;
  hashtags: string | null;
  likes: number;
  created_at: string;
  user_name: string;
  user_avatar: string;
  user_role: string;
  isLiked?: boolean;
  comments?: Comment[];
}

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  participant_count: number;
  creator_name: string;
  creator_avatar: string;
}

export default function Community() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostHashtags, setNewPostHashtags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', startDate: '', endDate: '' });
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});
  const [showComments, setShowComments] = useState<{[key: number]: boolean}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const challengeFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    if (activeTab === 'feed') {
      if (tag) fetchPostsWithTag(tag);
      else fetchPosts();
    } else fetchChallenges();
  }, [activeTab, token]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/community/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/community/challenges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('content', newPostContent);
    formData.append('hashtags', newPostHashtags);
    if (selectedFile) formData.append('media', selectedFile);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setNewPostContent("");
        setNewPostHashtags("");
        setSelectedFile(null);
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', newChallenge.title);
    formData.append('description', newChallenge.description);
    formData.append('startDate', newChallenge.startDate);
    formData.append('endDate', newChallenge.endDate);
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/community/challenges', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setIsCreatingChallenge(false);
        setNewChallenge({ title: '', description: '', startDate: '', endDate: '' });
        setSelectedFile(null);
        fetchChallenges();
      }
    } catch (error) {
      console.error("Failed to create challenge:", error);
    }
  };

  const handleJoinChallenge = async (id: number) => {
    try {
      const response = await fetch(`/api/community/challenges/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Joined challenge!");
        fetchChallenges();
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to join challenge:", error);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes, isLiked: true } 
            : post
        ));
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleUnlikePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes, isLiked: false } 
            : post
        ));
      }
    } catch (error) {
      console.error("Failed to unlike post:", error);
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      if (response.ok) {
        const newComment = await response.json();
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: [...(post.comments || []), newComment] } 
            : post
        ));
        setCommentInputs({ ...commentInputs, [postId]: '' });
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const toggleComments = async (postId: number) => {
    const currentlyShown = showComments[postId];
    setShowComments({ ...showComments, [postId]: !currentlyShown });

    if (!currentlyShown) {
      try {
        const response = await fetch(`/api/community/posts/${postId}/comments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const comments = await response.json();
          setPosts(posts.map(post => 
            post.id === postId 
              ? { ...post, comments } 
              : post
          ));
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    }
  };

  const handleFilterByTag = (tag: string) => {
    // simple filter: refetch posts with tag query
    fetchPostsWithTag(tag);
  };

  const renderWithHashtags = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <a key={i} onClick={() => handleFilterByTag(tag)} className="text-emerald-400 cursor-pointer hover:text-emerald-300">{part}</a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const fetchPostsWithTag = async (tag: string) => {
    try {
      const response = await fetch(`/api/community/posts?tag=${encodeURIComponent(tag)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts by tag:', error);
    }
  };

  // User profile modal
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const openUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`/api/community/users/${userId}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const closeProfile = () => setSelectedProfile(null);

  const handleFollow = async (userId: number) => {
    try {
      const res = await fetch(`/api/community/users/${userId}/follow`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        // refresh profile
        openUserProfile(userId);
      }
    } catch (err) { console.error(err); }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      const res = await fetch(`/api/community/users/${userId}/follow`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) openUserProfile(userId);
    } catch (err) { console.error(err); }
  };

  const handleRequestChat = async (userId: number) => {
    try {
      const res = await fetch(`/api/community/users/${userId}/chat`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) openUserProfile(userId);
    } catch (err) { console.error(err); }
  };

  const handleInviteToChallenge = async (userId: number, challengeId: number) => {
    try {
      const res = await fetch(`/api/community/challenges/${challengeId}/invite`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      if (res.ok) alert('Invitation sent');
    } catch (err) { console.error(err); }
  };

  // Share
  const handleSharePost = async (post: Post) => {
    const shareData = { title: `${post.user_name} on Fit`, text: post.content, url: window.location.origin + `/app/community?post=${post.id}` };
    try {
      if ((navigator as any).share) {
        await (navigator as any).share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Post link copied to clipboard');
      }
    } catch (err) {
      console.error('Share failed', err);
      alert('Unable to share');
    }
  };

  const handleShareChallenge = async (challenge: Challenge) => {
    const url = window.location.origin + `/app/community?challenge=${challenge.id}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: challenge.title, text: challenge.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Challenge link copied to clipboard');
      }
    } catch (err) {
      console.error('Share failed', err);
      alert('Unable to share');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex backdrop-blur-md bg-white/10 p-1 rounded-xl border border-white/20">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'feed' ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/60 hover:text-white/80'}`}
          >
            Community Feed
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'challenges' ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/60 hover:text-white/80'}`}
          >
            Challenges
          </button>
        </div>

        {activeTab === 'feed' ? (
          <>
            {/* Create Post */}
            <div className="backdrop-blur-md bg-white/10 p-4 rounded-2xl border border-white/20">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                    <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your progress..."
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 focus:ring-0 resize-none text-white placeholder:text-white/40 min-h-[80px] rounded-lg p-3"
                    />
                    {selectedFile && (
                      <div className="relative w-fit mb-2">
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-20 rounded-lg object-cover border border-white/20" />
                        <button 
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-emerald-300 transition-colors"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                          className="hidden" 
                          accept="image/*"
                        />
                        <input 
                          type="text" 
                          value={newPostHashtags}
                          onChange={(e) => setNewPostHashtags(e.target.value)}
                          placeholder="#hashtags"
                          className="text-sm bg-transparent border-none focus:ring-0 text-emerald-400 placeholder:text-white/40"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!newPostContent.trim() && !selectedFile}
                        className="bg-emerald-500/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 backdrop-blur-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                      <img src={post.user_avatar} alt={post.user_name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white cursor-pointer" onClick={() => openUserProfile(post.user_id)}>{post.user_name}</h3>
                      <p className="text-xs text-white/60">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-2">
                    <p className="text-white/80 mb-2">{renderWithHashtags(post.content)}</p>
                    {post.hashtags && <p className="text-emerald-300 text-sm">{renderWithHashtags(post.hashtags)}</p>}
                  </div>

                  {post.media_url && (
                    <div className="w-full h-64 bg-slate-700 border-t border-white/10">
                      <img src={post.media_url} alt="Post content" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-6 mb-3">
                      <button 
                        onClick={() => post.isLiked ? handleUnlikePost(post.id) : handleLikePost(post.id)}
                        className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-rose-400' : 'text-white/60 hover:text-rose-400'}`}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.likes}</span>
                      </button>
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 text-white/60 hover:text-emerald-300 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Comment</span>
                      </button>
                      <button onClick={() => handleSharePost(post)} className="flex items-center gap-2 text-white/60 hover:text-emerald-300 transition-colors ml-auto">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    {showComments[post.id] && (
                      <div className="space-y-3">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                              <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white text-sm">{comment.user_name}</span>
                                <span className="text-xs text-white/60">{new Date(comment.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-white/80 text-sm">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                            <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              placeholder="Write a comment..."
                              className="flex-1 bg-white/5 border border-white/10 focus:border-white/30 focus:ring-0 text-white placeholder:text-white/40 text-sm rounded-lg px-3 py-2"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="bg-emerald-500/80 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Challenges Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Active Challenges</h2>
              <button 
                onClick={() => setIsCreatingChallenge(true)}
                className="bg-emerald-500/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4" /> Create Challenge
              </button>
            </div>

            {/* Create Challenge Modal (Inline for simplicity) */}
            {isCreatingChallenge && (
              <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Create New Challenge</h3>
                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Challenge Title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    className="w-full p-2 border border-white/20 bg-white/5 rounded-lg text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    className="w-full p-2 border border-white/20 bg-white/5 rounded-lg text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newChallenge.startDate}
                      onChange={(e) => setNewChallenge({...newChallenge, startDate: e.target.value})}
                      className="w-full p-2 border border-white/20 bg-white/5 rounded-lg text-white focus:border-white/40 focus:ring-0"
                    />
                    <input
                      type="date"
                      value={newChallenge.endDate}
                      onChange={(e) => setNewChallenge({...newChallenge, endDate: e.target.value})}
                      className="w-full p-2 border border-white/20 bg-white/5 rounded-lg text-white focus:border-white/40 focus:ring-0"
                    />
                  </div>
                  <input 
                    type="file" 
                    ref={challengeFileRef}
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                    className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/30 file:text-emerald-200 hover:file:bg-emerald-500/50"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingChallenge(false)}
                      className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-emerald-500/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Challenges List */}
            <div className="grid md:grid-cols-2 gap-6">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 overflow-hidden flex flex-col">
                  <div className="h-40 bg-slate-700 relative">
                    {challenge.image_url && (
                      <img src={challenge.image_url} alt={challenge.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-4 right-4 backdrop-blur-md bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 flex items-center gap-1 border border-white/30">
                      <Users className="w-3 h-3" /> {challenge.participant_count}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">{challenge.title}</h3>
                    <p className="text-white/60 text-sm mb-4 flex-1">{challenge.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-white/50 mb-6">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(challenge.start_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Prize Pool
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="flex-1 bg-emerald-500/80 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
                      >
                        Join Challenge
                      </button>
                      <button 
                        onClick={() => window.location.href = `/app/chat?challenge=${challenge.id}`}
                        className="px-3 py-2 border border-white/20 rounded-lg hover:bg-white/10 text-white/60"
                        title="Group Chat"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleShareChallenge(challenge)} className="px-3 py-2 border border-white/20 rounded-lg hover:bg-white/10 text-white/60">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg border border-white/20">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{selectedProfile.name}</h3>
              <button onClick={closeProfile} className="text-white/60">✕</button>
            </div>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <img src={selectedProfile.avatar} alt={selectedProfile.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-white/70 mb-2">{selectedProfile.role}</p>
                <p className="text-white/60 mb-4">Points: {selectedProfile.points}</p>
                <div className="flex gap-2">
                  {selectedProfile.isFollowing ? (
                    <button onClick={() => handleUnfollow(selectedProfile.id)} className="px-3 py-2 bg-rose-500 text-white rounded-lg">Unfollow</button>
                  ) : (
                    <button onClick={() => handleFollow(selectedProfile.id)} className="px-3 py-2 bg-emerald-500 text-white rounded-lg">Follow</button>
                  )}
                  <button onClick={() => handleRequestChat(selectedProfile.id)} className="px-3 py-2 border border-white/20 text-white rounded-lg">Request Chat</button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-white/80 mb-2">Invite to Challenge</h4>
              <div className="flex gap-2 overflow-x-auto">
                {challenges.map((c) => (
                  <button key={c.id} onClick={() => handleInviteToChallenge(selectedProfile.id, c.id)} className="px-3 py-2 bg-white/5 text-white rounded-lg">{c.title}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
