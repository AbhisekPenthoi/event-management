import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './LiveStage.css';

const LiveStage = ({ eventId }) => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('chat');
    const [interactions, setInteractions] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    const fetchInteractions = useCallback(async () => {
        try {
            const response = await axios.get(`/api/interactions/${eventId}`);
            setInteractions(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching interactions:', error);
            setLoading(false);
        }
    }, [eventId]);

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        fetchInteractions();
        const interval = setInterval(fetchInteractions, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [eventId, fetchInteractions]);

    useEffect(() => {
        scrollToBottom();
    }, [interactions, scrollToBottom]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            if (!user) {
                toast.error('Please login to post messages');
                return;
            }
            const response = await axios.post(`/api/interactions/${eventId}`, {
                type: activeTab,
                content: message
            });
            setInteractions([...interactions, response.data]);
            setMessage('');
        } catch (error) {
            toast.error('Failed to post');
        }
    };

    const handleUpvote = async (id) => {
        try {
            await axios.put(`/api/interactions/${id}/upvote`);
            setInteractions(interactions.map(i =>
                i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i
            ));
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    };

    if (loading) return <div className="live-stage-loading">Initializing Live Stage...</div>;

    const chatMessages = interactions.filter(i => i.type === 'chat');
    const questions = interactions.filter(i => i.type === 'question').sort((a, b) => b.upvotes - a.upvotes);

    return (
        <div className="live-stage-container elite-card">
            <div className="live-stage-header">
                <div className="live-indicator">
                    <span className="live-dot"></span> LIVE
                </div>
                <h3>Event Connection Hub</h3>
            </div>

            <div className="live-stage-tabs">
                <button
                    className={activeTab === 'chat' ? 'active' : ''}
                    onClick={() => setActiveTab('chat')}
                >
                    💬 Chat
                </button>
                <button
                    className={activeTab === 'question' ? 'active' : ''}
                    onClick={() => setActiveTab('question')}
                >
                    ❓ Q&A
                </button>
            </div>

            <div className="live-stage-content">
                {activeTab === 'chat' ? (
                    <div className="chat-area">
                        <div className="messages-list">
                            {chatMessages.length === 0 ? (
                                <p className="empty-state">No messages yet. Start the conversation!</p>
                            ) : (
                                chatMessages.map(msg => (
                                    <div key={msg.id} className={`message-item ${msg.user_id === user?.userId ? 'own-message' : ''}`}>
                                        <span className="message-user">{msg.fullName || msg.username}</span>
                                        <p className="message-text">{msg.content}</p>
                                        <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                ) : (
                    <div className="qa-area">
                        <div className="questions-list">
                            {questions.length === 0 ? (
                                <p className="empty-state">No questions yet. Be the first to ask!</p>
                            ) : (
                                questions.map(q => (
                                    <div key={q.id} className="question-item">
                                        <div className="question-main">
                                            <span className="question-user">{q.fullName || q.username}</span>
                                            <p className="question-text">{q.content}</p>
                                        </div>
                                        <button className="upvote-btn" onClick={() => handleUpvote(q.id)}>
                                            🔼 {q.upvotes}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <form className="live-stage-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder={activeTab === 'chat' ? 'Say something...' : 'Ask a question...'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit" className="send-btn">
                    {activeTab === 'chat' ? 'Send' : 'Ask'}
                </button>
            </form>
        </div>
    );
};

export default LiveStage;
