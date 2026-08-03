import { useState, useRef, useEffect } from 'react';
import {
  Box, IconButton, Paper, Typography, TextField, 
  Avatar, CircularProgress, Fab, Zoom, Divider
} from '@mui/material';
import { 
  Chat, Close, Send, SmartToy, Person 
} from '@mui/icons-material';
import api from '../services/api';
import Draggable from 'react-draggable';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your Eastpoint Intelligence assistant. Ask me about purchase history or LPP (e.g., 'LPP for cement')", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const nodeRef = useRef(null);

  // Track dragging to distinguish from clicking
  const [dragging, setDragging] = useState(false);

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('chatbot_position');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const handleDrag = (e, data) => {
    setDragging(true);
    setPosition({ x: data.x, y: data.y });
  };

  const handleStop = (e, data) => {
    const newPos = { x: data.x, y: data.y };
    setPosition(newPos);
    localStorage.setItem('chatbot_position', JSON.stringify(newPos));
    
    // reset dragging state slightly after so onClick doesn't fire immediately
    setTimeout(() => setDragging(false), 100);
  };

  const toggleChat = (e) => {
    if (dragging) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    setOpen(prev => !prev);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.get('/api/intelligence/query', { params: { q: userMsg } });
      setMessages(prev => [...prev, { text: res.data.answer, isBot: true }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Draggable 
      nodeRef={nodeRef} 
      position={position}
      onDrag={handleDrag}
      onStop={handleStop}
      handle=".drag-handle"
    >
      <div 
        ref={nodeRef} 
        style={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          zIndex: 2000,
          width: 24,
          height: 24
        }}
      >
        {/* Chat Window */}
        <Zoom in={open} unmountOnExit>
          <Paper 
            sx={{ 
              position: 'absolute',
              bottom: 34,
              right: 0,
              width: 350, 
              height: 450, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.05)',
              cursor: 'auto'
            }}
          >
            {/* Header (Draggable Area) */}
            <Box className="drag-handle" sx={{ p: 2, bgcolor: '#1E293B', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'grab' }}>
              <Avatar sx={{ bgcolor: '#3B82F6', width: 32, height: 32 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>Eastpoint Bot</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>Always Online</Typography>
              </Box>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(false); }} sx={{ ml: 'auto', color: '#fff' }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            {/* Messages Area (Non-draggable) */}
            <Box 
              ref={scrollRef}
              sx={{ 
                flexGrow: 1, 
                p: 2, 
                overflowY: 'auto', 
                bgcolor: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              {messages.map((m, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    alignSelf: m.isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    display: 'flex',
                    gap: 1,
                    flexDirection: m.isBot ? 'row' : 'row-reverse'
                  }}
                >
                  <Avatar sx={{ width: 24, height: 24, bgcolor: m.isBot ? '#3B82F6' : '#64748B', fontSize: '0.7rem' }}>
                    {m.isBot ? <SmartToy sx={{ fontSize: 14 }} /> : <Person sx={{ fontSize: 14 }} />}
                  </Avatar>
                  <Paper 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: m.isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
                      bgcolor: m.isBot ? '#fff' : '#2563EB',
                      color: m.isBot ? '#1E293B' : '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                      {m.text}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {loading && (
                <Box sx={{ alignSelf: 'flex-start', ml: 4 }}>
                  <CircularProgress size={16} />
                </Box>
              )}
            </Box>

            {/* Input Area (Non-draggable) */}
            <Divider />
            <Box sx={{ p: 2, bgcolor: '#fff', display: 'flex', gap: 1 }}>
              <TextField 
                fullWidth 
                size="small" 
                placeholder="Ask me something..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
              />
              <IconButton 
                color="primary" 
                onClick={handleSend} 
                disabled={!input.trim() || loading}
              >
                <Send />
              </IconButton>
            </Box>
          </Paper>
        </Zoom>

        {/* Floating Action Button */}
        <Zoom in={!open}>
          <Fab 
            color="primary" 
            className="drag-handle"
            onClick={toggleChat}
            sx={{ 
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              minHeight: 24,
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
              '&:hover': { transform: 'scale(1.1)' },
              transition: 'all 0.2s',
              cursor: 'grab'
            }}
          >
            <Chat sx={{ fontSize: 14 }} />
          </Fab>
        </Zoom>
      </div>
    </Draggable>
  );
}
