import React, { useState, useEffect } from 'react';
import styles from '../styles/chatbot.module.css';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    text: "👋 Hi! I'm TraceBot, here to assist users like you. What can I help you with today?\n\nYou can ask me about:\n• Reporting missing persons\n•  Using filters\n• Matching system\n• Privacy & security",
                    sender: 'bot'
                }
            ]);
        }
    }, [messages.length]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages([...messages, userMessage]);
        setInput('');

        try {
            const response = await fetch('/api/missing-persons/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input })
            });
            const botResponse = await response.json();
            setMessages(prev => [...prev, { text: botResponse.message, sender: 'bot' }]);
        } catch (error) {
            console.error('Bot error:', error);
        }
    };

    return (
        <div className={styles.chatbotContainer}>
            <button
                className={styles.chatbotButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <>
                        <FaTimes /> Close Chat
                    </>
                ) : (
                    <>
                        <FaRobot /> Need Help?
                    </>
                )}
            </button>

            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <FaRobot className={styles.botIcon} />
                        <span>TraceBot Assistant</span>
                    </div>
                    <div className={styles.messageArea}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`${styles.message} ${styles[msg.sender]}`}>
                                {msg.sender === 'bot' && <FaRobot className={styles.messageIcon} />}
                                <span className={styles.messageText}>{msg.text}</span>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className={styles.input}
                        />
                        <button type="submit" className={styles.sendButton}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatBot;
