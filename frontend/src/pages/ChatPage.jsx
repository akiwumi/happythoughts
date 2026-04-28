import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/hooks/useAuth'
import { useToast } from '../app/hooks/useToast'
import { useSocket, useSocketEvent } from '../app/hooks/useSocket'
import { messagesService } from '../services/api'
import { Spinner, Toast } from '../components/common'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function MessageBubble({ msg, isOwn, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.text)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!editText.trim()) return
    setSaving(true)
    await onEdit(msg._id, editText.trim())
    setSaving(false)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { setEditing(false); setEditText(msg.text) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 2 }}>
      {!isOwn && (
        <span style={{ fontSize: 11, color: 'var(--ds-subtext, #7b8790)', paddingLeft: 4 }}>
          {msg.author?.name || 'User'}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
        <div style={{
          maxWidth: 420,
          padding: '10px 14px',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isOwn ? 'linear-gradient(135deg, #2ec8a8, #23a88e)' : 'white',
          color: isOwn ? 'white' : 'var(--ds-text, #24303a)',
          fontSize: 14,
          lineHeight: 1.5,
          boxShadow: '0 1px 4px rgba(38,49,63,0.08)',
          wordBreak: 'break-word',
        }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={2}
                maxLength={500}
                style={{
                  width: 280,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: 13,
                  resize: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !editText.trim()}
                  style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer', fontSize: 12 }}
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(msg.text) }}
                  style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            msg.text
          )}
        </div>

        {isOwn && !editing && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setEditing(true)}
              title="Edit"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-subtext, #7b8790)', fontSize: 13, padding: '2px 4px' }}
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(msg._id)}
              title="Delete"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: 13, padding: '2px 4px' }}
            >
              🗑
            </button>
          </div>
        )}
      </div>

      <span style={{ fontSize: 10, color: 'var(--ds-subtext, #7b8790)', paddingLeft: 4, paddingRight: 4 }}>
        {timeAgo(msg.createdAt)}
        {msg.updatedAt && msg.updatedAt !== msg.createdAt ? ' · edited' : ''}
      </span>
    </div>
  )
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()
  const { toast, show: showToast } = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onNewMessage = useCallback((msg) => {
    setMessages((prev) => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg])
  }, [])

  const onMessageUpdated = useCallback((msg) => {
    setMessages((prev) => prev.map((m) => m._id === msg._id ? msg : m))
  }, [])

  const onMessageDeleted = useCallback(({ id }) => {
    setMessages((prev) => prev.filter((m) => m._id !== id))
  }, [])

  useSocketEvent('message:new', onNewMessage)
  useSocketEvent('message:updated', onMessageUpdated)
  useSocketEvent('message:deleted', onMessageDeleted)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await messagesService.getAll()
      setMessages(data.messages || [])
    } catch {
      showToast('Failed to load messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const data = await messagesService.send(text.trim())
      // socket will broadcast; add optimistically to avoid double-add from own socket event
      setMessages((prev) => prev.some((m) => m._id === data.message._id) ? prev : [...prev, data.message])
      setText('')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleEdit = async (id, newText) => {
    try {
      const data = await messagesService.edit(id, newText)
      setMessages((prev) => prev.map((m) => m._id === id ? data.message : m))
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to edit', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await messagesService.remove(id)
      setMessages((prev) => prev.filter((m) => m._id !== id))
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--ds-bg, #f4f7fa)' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--ds-muted, #edf2f5)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/thoughts" style={{ color: 'var(--ds-subtext, #7b8790)', textDecoration: 'none', fontSize: 13 }}>
            ← Thoughts
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ds-text, #24303a)' }}>
            Happy Thoughts Chat
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isConnected ? '#2ec8a8' : '#aaa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#2ec8a8' : '#aaa', display: 'inline-block' }} />
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ color: 'var(--ds-subtext, #7b8790)' }}>{user?.name}</span>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-subtext, #7b8790)', fontSize: 13 }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ margin: 'auto' }}><Spinner /></div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--ds-subtext, #7b8790)', fontSize: 14 }}>
            No messages yet — say something!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.author?._id === user?._id || msg.author?._id === user?.id
            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isOwn={isOwn}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        style={{
          background: 'white',
          borderTop: '1px solid var(--ds-muted, #edf2f5)',
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
          placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
          maxLength={500}
          rows={1}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--ds-muted, #edf2f5)',
            fontSize: 14,
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: text.trim() ? 'linear-gradient(135deg, #2ec8a8, #23a88e)' : '#ccc',
            color: 'white',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
