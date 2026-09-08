import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot, User, Send as TelegramIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ChatMessage {
  id: string
  sender: string
  content: string
  created_at: string
}

interface TelegramConfig {
  telegram_bot_username: string | null
  telegram_bot_token: string | null
  whatsapp_number: string | null
}

const GUEST_ID_KEY = 'chat_guest_id'

function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

export default function ChatWidget() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const [telegramBot, setTelegramBot] = useState<string | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.rpc('get_public_settings').then(({ data }) => {
      const settings = data as { telegram_bot_username?: string | null; whatsapp_number?: string | null } | null
      if (settings?.telegram_bot_username) {
        setTelegramBot(settings.telegram_bot_username)
      }
      if (settings?.whatsapp_number) {
        setWhatsappNumber(settings.whatsapp_number)
      }
    })
  }, [])

  useEffect(() => {
    if (open) {
      setUnread(0)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  async function startConversation() {
    setLoading(true)
    try {
      const guestId = session ? undefined : getGuestId()
      const body: Record<string, unknown> = { action: 'start_conversation' }
      if (session) {
        body.user_id = session.user.id
      } else {
        body.guest_id = guestId
      }

      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: JSON.stringify(body),
      })

      if (error || data?.error) throw new Error(data?.error ?? 'Failed to start chat')

      setConversationId(data.conversation.id)
      setMessages([{
        id: 'welcome',
        sender: 'bot',
        content: data.welcome,
        created_at: new Date().toISOString(),
      }])
    } catch {
      setMessages([{
        id: 'err',
        sender: 'bot',
        content: 'Sorry, I could not start the chat. Please try again later.',
        created_at: new Date().toISOString(),
      }])
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || !conversationId) return
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: input,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    const msgText = input
    setInput('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        action: 'send_message',
        conversation_id: conversationId,
        message: msgText,
      }
      if (!session) {
        body.guest_id = getGuestId()
      }
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: JSON.stringify(body),
      })
      if (error || data?.error) throw new Error(data?.error ?? 'Failed to send message')

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        content: data.reply,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, botMsg])
      if (!open) setUnread((u) => u + 1)
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'bot',
        content: 'Sorry, I could not respond right now. Please try again.',
        created_at: new Date().toISOString(),
      }])
    }
    setLoading(false)
  }

  function handleOpen() {
    setOpen(true)
    if (!conversationId) {
      startConversation()
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-ink-700 text-ivory-50 shadow-sm hover:bg-ink-800 transition-all flex items-center justify-center hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-mink-500 text-white text-xs flex items-center justify-center font-medium">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[500px] max-h-[70vh] bg-ivory-50 rounded-2xl shadow-sm flex flex-col animate-scale-in overflow-hidden border border-stone-200">
          {/* Header */}
          <div className="bg-ink-700 text-ivory-50 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-ivory-50/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-serif text-sm">Store Assistant</h3>
                <p className="text-xs text-ivory-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-ivory-200 hover:text-ivory-50 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ivory-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-ink-600" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-ink-700 text-ivory-50 rounded-br-sm'
                      : msg.sender === 'admin'
                      ? 'bg-mink-100 text-ink-700 rounded-bl-sm'
                      : 'bg-white text-ink-700 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-ivory-200 flex items-center justify-center shrink-0">
                    <User size={14} className="text-ink-500" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-ink-600" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
              {['Track my order', 'Shipping info', 'Return policy', 'Payment methods'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-ivory-100 text-ink-600 hover:bg-mink-100 hover:text-mink-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-stone-200 bg-white shrink-0">
            {(telegramBot || whatsappNumber) && (
              <div className="flex gap-2 mb-2">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-full bg-[#25D366] text-white text-xs font-medium hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                )}
                {telegramBot && (
                  <a
                    href={`https://t.me/${telegramBot}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-full bg-[#229ED9] text-white text-xs font-medium hover:bg-[#1d8ec2] transition-colors"
                  >
                    <TelegramIcon size={14} />
                    Telegram
                  </a>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-full bg-ivory-100 text-sm text-ink-700 outline-none focus:ring-2 focus:ring-mink-300"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-ink-700 text-ivory-50 flex items-center justify-center hover:bg-ink-800 transition-all disabled:opacity-50 shrink-0"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
