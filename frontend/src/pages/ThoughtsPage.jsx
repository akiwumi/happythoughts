import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/hooks/useAuth'
import { useToast } from '../app/hooks/useToast'
import { thoughtsService } from '../services/api'
import { Spinner, Toast } from '../components/common'

const MAX = 140
const MIN = 5

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function ThoughtCard({ thought, currentUser, onLike, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(thought.message)
  const [saving, setSaving] = useState(false)
  const isOwner = currentUser && (
    thought.author?._id === currentUser._id ||
    thought.author?._id === currentUser.id
  )

  const handleSave = async () => {
    if (editText.trim().length < MIN || editText.trim().length > MAX) return
    setSaving(true)
    await onEdit(thought._id, editText.trim())
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '18px 20px',
      boxShadow: '0 2px 8px rgba(38,49,63,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {editing ? (
        <>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={MAX}
            rows={3}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--ds-muted, #edf2f5)',
              fontSize: 14,
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--ds-subtext, #7b8790)', textAlign: 'right' }}>
            {editText.length}/{MAX}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || editText.trim().length < MIN}
              style={btnStyle('#2ec8a8')}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setEditText(thought.message) }} style={btnStyle('#aaa')}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ds-text, #24303a)', lineHeight: 1.5 }}>
          {thought.message}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--ds-subtext, #7b8790)' }}>
          <span style={{ fontWeight: 600, color: 'var(--ds-text, #24303a)' }}>
            {thought.author?.name || 'Unknown'}
          </span>
          {' · '}
          {timeAgo(thought.createdAt)}
          {thought.updatedAt && thought.updatedAt !== thought.createdAt && ' · edited'}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => onLike(thought._id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ds-subtext, #7b8790)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 6 }}
          >
            ♥ {thought.likes}
          </button>

          {isOwner && !editing && (
            <>
              <button onClick={() => setEditing(true)} style={ghostBtn}>Edit</button>
              <button onClick={() => onDelete(thought._id)} style={{ ...ghostBtn, color: '#ff6b6b' }}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const btnStyle = (bg) => ({
  padding: '6px 14px',
  borderRadius: 8,
  border: 'none',
  background: bg,
  color: 'white',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
})

const ghostBtn = {
  background: 'none',
  border: '1px solid var(--ds-muted, #edf2f5)',
  borderRadius: 6,
  padding: '3px 10px',
  cursor: 'pointer',
  fontSize: 12,
  color: 'var(--ds-subtext, #7b8790)',
}

export default function ThoughtsPage() {
  const { user, logout } = useAuth()
  const { toast, show: showToast } = useToast()
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchThoughts()
  }, [])

  const fetchThoughts = async () => {
    try {
      setLoading(true)
      const data = await thoughtsService.getThoughts()
      setThoughts(data.thoughts || [])
    } catch {
      showToast('Failed to load thoughts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (trimmed.length < MIN || trimmed.length > MAX) return
    setPosting(true)
    try {
      const data = await thoughtsService.createThought(trimmed)
      setThoughts((prev) => [data.thought, ...prev])
      setNewMessage('')
      showToast('Thought posted!', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to post thought', 'error')
    } finally {
      setPosting(false)
    }
  }

  const handleLike = async (id) => {
    try {
      const data = await thoughtsService.likeThought(id)
      setThoughts((prev) =>
        prev.map((t) => t._id === id ? { ...t, likes: data.likes } : t)
      )
    } catch {
      showToast('Failed to like thought', 'error')
    }
  }

  const handleEdit = async (id, message) => {
    try {
      const data = await thoughtsService.editThought(id, message)
      setThoughts((prev) =>
        prev.map((t) => t._id === id ? data.thought : t)
      )
      showToast('Thought updated', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update thought', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this thought?')) return
    try {
      await thoughtsService.deleteThought(id)
      setThoughts((prev) => prev.filter((t) => t._id !== id))
      showToast('Thought deleted', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete thought', 'error')
    }
  }

  const remaining = MAX - newMessage.length
  const canPost = newMessage.trim().length >= MIN && newMessage.trim().length <= MAX

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ds-bg, #f4f7fa)' }}>
      {/* Nav */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid var(--ds-muted, #edf2f5)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ds-accent, #2ec8a8)' }}>
          Happy Thoughts
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          {user ? (
            <>
              <span style={{ color: 'var(--ds-subtext, #7b8790)' }}>Hi, {user.name}</span>
              <Link to="/chat" style={{ color: 'var(--ds-accent, #2ec8a8)', textDecoration: 'none', fontWeight: 600 }}>Chat</Link>
              <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-subtext, #7b8790)', fontSize: 14 }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--ds-accent, #2ec8a8)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
              <Link to="/register" style={{ color: 'var(--ds-accent, #2ec8a8)', textDecoration: 'none', fontWeight: 600 }}>Register</Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 16px' }}>
        {/* Create form */}
        {user ? (
          <form onSubmit={handlePost} style={{
            background: 'white',
            borderRadius: 12,
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(38,49,63,0.06)',
            marginBottom: 28,
          }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 10, color: 'var(--ds-text, #24303a)' }}>
              What's making you happy right now?
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share a happy thought… (5–140 characters)"
              maxLength={MAX}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--ds-muted, #edf2f5)',
                fontSize: 14,
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: remaining < 20 ? '#ff6b6b' : 'var(--ds-subtext, #7b8790)' }}>
                {remaining} characters left
              </span>
              <button
                type="submit"
                disabled={posting || !canPost}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: canPost ? 'linear-gradient(180deg, #2ec8a8, #23a88e)' : '#ccc',
                  color: 'white',
                  cursor: canPost ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(38,49,63,0.06)',
            marginBottom: 28,
            textAlign: 'center',
            color: 'var(--ds-subtext, #7b8790)',
            fontSize: 14,
          }}>
            <Link to="/login" style={{ color: 'var(--ds-accent, #2ec8a8)', fontWeight: 600 }}>Login</Link> to post your own happy thoughts
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
        ) : thoughts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ds-subtext, #7b8790)', padding: 40 }}>
            No thoughts yet. Be the first!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {thoughts.map((t) => (
              <ThoughtCard
                key={t._id}
                thought={t}
                currentUser={user}
                onLike={handleLike}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
