'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Key, CheckCircle, AlertTriangle, ExternalLink, X } from 'lucide-react';

interface Message {
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface SetupAgentProps {
  isOpen: boolean;
  onClose: () => void;
  missingKeys?: string[];
}

const keyGuides: Record<string, { steps: string[]; url: string; urlLabel: string }> = {
  TELNYX_API_KEY: {
    steps: [
      'Go to telnyx.com and create a free account',
      'Navigate to API Keys in the dashboard',
      'Click "Create API Key" and copy it',
      'Paste it here and I\'ll configure it for you',
    ],
    url: 'https://telnyx.com',
    urlLabel: 'Get Telnyx Key',
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    steps: [
      'Go to supabase.com and create a free account',
      'Create a new project',
      'Go to Settings → API',
      'Copy the "Project URL"',
    ],
    url: 'https://supabase.com',
    urlLabel: 'Get Supabase URL',
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    steps: [
      'In your Supabase project, go to Settings → API',
      'Copy the "Publishable key" (anon key)',
    ],
    url: 'https://supabase.com',
    urlLabel: 'Open Supabase',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    steps: [
      'In your Supabase project, go to Settings → API',
      'Copy the "Secret key" (service role key)',
      'This one is sensitive — never share it publicly',
    ],
    url: 'https://supabase.com',
    urlLabel: 'Open Supabase',
  },
};

export function SetupAgent({ isOpen, onClose, missingKeys = [] }: SetupAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const [configuredKeys, setConfiguredKeys] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessage: Message = {
        role: 'agent',
        content: missingKeys.length > 0
          ? `Hey! I noticed your deployment hit a snag. Looks like you're missing ${missingKeys.length} API key${missingKeys.length > 1 ? 's' : ''}. Don't worry — this happens to everyone on their first build. Let me walk you through getting set up. It takes about 2 minutes.`
          : 'Hey! I\'m your Setup Agent. I can help you configure API keys, troubleshoot deployment issues, or answer questions about how AppForge works. What do you need?',
        timestamp: new Date(),
      };
      setMessages([initialMessage]);

      if (missingKeys.length > 0) {
        setTimeout(() => {
          const key = missingKeys[0];
          const guide = keyGuides[key];
          if (guide) {
            setMessages(prev => [...prev, {
              role: 'agent',
              content: `Let's start with **${key}**. Here's what to do:\n\n${guide.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
              timestamp: new Date(),
              action: { label: guide.urlLabel, href: guide.url },
            }]);
          }
        }, 1000);
      }
    }
  }, [isOpen, missingKeys]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate agent response
    setTimeout(() => {
      const currentKey = missingKeys[currentKeyIndex];
      if (currentKey && input.length > 10) {
        // User probably pasted a key
        setConfiguredKeys(prev => new Set([...prev, currentKey]));
        const nextIndex = currentKeyIndex + 1;
        setCurrentKeyIndex(nextIndex);

        if (nextIndex < missingKeys.length) {
          const nextKey = missingKeys[nextIndex];
          const guide = keyGuides[nextKey];
          setMessages(prev => [...prev, {
            role: 'agent',
            content: `Got it! **${currentKey}** is configured. ${configuredKeys.size + 1} of ${missingKeys.length} keys done.\n\nNext up: **${nextKey}**\n\n${guide ? guide.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'Please provide this key.'}`,
            timestamp: new Date(),
            action: guide ? { label: guide.urlLabel, href: guide.url } : undefined,
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'agent',
            content: '**All keys configured!** Your deployment should work now. I\'ll retry it for you automatically. If anything else comes up, I\'m right here.',
            timestamp: new Date(),
            action: { label: 'Retry Deployment', onClick: () => window.location.reload() },
          }]);
        }
      } else {
        // Generic response
        setMessages(prev => [...prev, {
          role: 'agent',
          content: 'I can help you with API key setup, deployment troubleshooting, or questions about AppForge. What specific issue are you running into?',
          timestamp: new Date(),
        }]);
      }
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] flex flex-col">
      <Card className="flex flex-col h-full shadow-2xl border-violet-500/30">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm">Setup Agent</CardTitle>
              <p className="text-xs text-white/40">
                {configuredKeys.size}/{missingKeys.length} keys configured
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-violet-500/20 text-white'
                  : 'bg-white/5 text-white/80'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.action && (
                  <div className="mt-2">
                    {msg.action.href ? (
                      <a href={msg.action.href} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="text-xs">
                          {msg.action.label} <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    ) : msg.action.onClick ? (
                      <Button variant="gradient" size="sm" className="text-xs" onClick={msg.action.onClick}>
                        {msg.action.label}
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Paste your API key or ask a question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
            />
            <Button variant="gradient" size="sm" onClick={handleSend}>
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
