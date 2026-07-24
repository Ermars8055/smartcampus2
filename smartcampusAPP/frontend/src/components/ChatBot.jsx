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
    <>
      {/* Floating Action Button */}
      <Draggable nodeRef={nodeRef} cancel=".no-drag">
        <div ref={nodeRef} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, cursor: 'grab' }}>
          <Zoom in={true}>
          <Fab 
            color="primary" 
            size="medium"
            onClick={() => setOpen(!open)}
            sx={{ 
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
              '&:hover': { transform: 'scale(1.1)' },
              transition: 'all 0.2s'
            }}
          >
            {open ? <Close /> : <Chat />}
          </Fab>
          </Zoom>
        </div>
      </Draggable>

      {/* Chat Window */}
      <Zoom in={open}>
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 90, 
            right: 24, 
            width: 350, 
            height: 450, 
            display: 'flex', 
            flexDirection: 'column',
            zIndex: 2000,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, bgcolor: '#1E293B', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#3B82F6', width: 32, height: 32 }}>
              <SmartToy fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>Eastpoint Bot</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Always Online</Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ ml: 'auto', color: '#fff' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages Area */}
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

          {/* Input Area */}
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
    </>
  );
}
