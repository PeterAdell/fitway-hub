import { useState, useEffect, useRef } from "react";
import React from "react";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Image as ImageIcon, X, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from '@/context/I18nContext';

interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
  is_premium: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  participant_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number | null;
  challenge_id: number | null;
  content: string;
  media_url: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

export default function Chat() {
  const { user, token } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'contacts' | 'challenges'>('contacts');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetchContacts();
    fetchChallenges();
    
    // Check URL parameters for challenge
    const urlParams = new URLSearchParams(window.location.search);
    const challengeId = urlParams.get('challenge');
    const coachId = urlParams.get('coach');
    if (challengeId) {
      setActiveTab('challenges');
      // Will be set after challenges are fetched
    }
  }, [token]);

  useEffect(() => {
    if (selectedContact) {
      setSelectedChallenge(null);
      fetchMessages(selectedContact.id);
      const interval = setInterval(() => fetchMessages(selectedContact.id), 3000);
      return () => clearInterval(interval);
    } else if (selectedChallenge) {
      setSelectedContact(null);
      fetchChallengeMessages(selectedChallenge.id);
      const interval = setInterval(() => fetchChallengeMessages(selectedChallenge.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedContact, selectedChallenge, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/chat/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setContacts(data);
      // Check for coach param to pre-select a coach contact
      const urlParams = new URLSearchParams(window.location.search);
      const coachId = urlParams.get('coach');
      if (coachId) {
        const c = data.find((u: User) => String(u.id) === coachId);
        if (c) {
          setSelectedContact(c);
          return;
        }
      }
      if (data.length > 0 && !selectedContact && !selectedChallenge) {
        setSelectedContact(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/community/challenges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setChallenges(data);
      
      // Check if we should select a challenge from URL
      const urlParams = new URLSearchParams(window.location.search);
      const challengeId = urlParams.get('challenge');
      if (challengeId) {
        const challenge = data.find((c: Challenge) => c.id === parseInt(challengeId));
        if (challenge) {
          setSelectedChallenge(challenge);
        }
      } else if (data.length > 0 && !selectedContact && !selectedChallenge) {
        setSelectedChallenge(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    }
  };

  const fetchMessages = async (contactId: number) => {
    try {
      const response = await fetch(`/api/chat/history/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchChallengeMessages = async (challengeId: number) => {
    try {
      const response = await fetch(`/api/chat/challenge/${challengeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch challenge messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || (!selectedContact && !selectedChallenge)) return;

    const formData = new FormData();
    if (selectedChallenge) {
      formData.append('challengeId', selectedChallenge.id.toString());
    } else if (selectedContact) {
      formData.append('receiverId', selectedContact.id.toString());
    }
    if (newMessage.trim()) formData.append('content', newMessage);
    if (selectedFile) formData.append('media', selectedFile);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setNewMessage("");
        setSelectedFile(null);
        if (selectedContact) fetchMessages(selectedContact.id);
        else if (selectedChallenge) fetchChallengeMessages(selectedChallenge.id);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="h-[calc(100vh-8rem)] backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/20 flex flex-col">
              <div className="p-4 border-b border-white/20">
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'contacts' ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/60 hover:text-white/80'}`}
              >
                    {t('contacts')}
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'challenges' ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/60 hover:text-white/80'}`}
              >
                    {t('groups')}
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                    placeholder={t('search_placeholder')} 
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'contacts' ? (
              contacts.map((contact) => (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors ${selectedContact?.id === contact.id ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : ''}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                      <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                    </div>
                    {/* Online indicator simulated */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{contact.name}</h3>
                      <span className="text-xs text-white/50">{t('now')}</span>
                    </div>
                    <p className="text-sm text-white/60 truncate">
                      {contact.role === 'coach' ? t('role_coach') : t('role_user')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              challenges.map((challenge) => (
                <div 
                  key={challenge.id}
                  onClick={() => setSelectedChallenge(challenge)}
                  className={`p-4 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors ${selectedChallenge?.id === challenge.id ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                    <Users className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{challenge.title}</h3>
                      <span className="text-xs text-white/50">{challenge.participant_count}</span>
                    </div>
                    <p className="text-sm text-white/60 truncate">
                      {challenge.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/40 to-purple-900/40">
          {(selectedContact || selectedChallenge) ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/20 flex items-center justify-between backdrop-blur-sm bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                    {selectedContact ? (
                      <img src={selectedContact.avatar} alt={selectedContact.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {selectedContact ? selectedContact.name : selectedChallenge?.title}
                    </h3>
                    <p className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {selectedContact ? 'Online' : `${selectedChallenge?.participant_count} members`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === Number(user?.id);
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isMe ? 'backdrop-blur-sm bg-emerald-500/40 text-white rounded-2xl rounded-tr-sm border border-emerald-500/50' : 'backdrop-blur-sm bg-white/10 text-white rounded-2xl rounded-tl-sm border border-white/20'} p-3`}>
                        {msg.media_url && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                            <img src={msg.media_url} alt="Shared media" className="max-w-full h-auto" />
                          </div>
                        )}
                        {msg.content && <p>{msg.content}</p>}
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-white/50'} text-right`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/20 backdrop-blur-sm bg-white/5">
                {selectedFile && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-white/10 rounded-lg w-fit border border-white/20">
                    <span className="text-xs text-white/80 truncate max-w-[200px]">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-white/60 hover:text-rose-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-emerald-300 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('type_message_placeholder')}
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() && !selectedFile}
                    className="p-2 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40">
              <div className="w-16 h-16 backdrop-blur-sm bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <ImageIcon className="w-8 h-8 text-white/30" />
              </div>
              <p>{t('select_contact_start')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
