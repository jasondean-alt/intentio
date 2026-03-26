'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  industry: string | null
  relationship: string | null
  notes: string | null
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    relationship: '',
    notes: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setContacts(data || [])
    }
    setLoading(false)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let error
    if (editingContact) {
      const result = await supabase
        .from('contacts')
        .update(formData)
        .eq('id', editingContact.id)
      error = result.error
    } else {
      const result = await supabase
        .from('contacts')
        .insert({ ...formData, user_id: user.id })
      error = result.error
    }

    if (error) {
      console.error('Error saving contact:', error)
      alert('Error saving contact: ' + error.message)
      return
    }

    setShowModal(false)
    setEditingContact(null)
    setFormData({ name: '', email: '', phone: '', company: '', industry: '', relationship: '', notes: '' })
    fetchContacts()
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      industry: contact.industry || '',
      relationship: contact.relationship || '',
      notes: contact.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await supabase.from('contacts').delete().eq('id', id)
      fetchContacts()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-blue-200">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            setEditingContact(null)
            setFormData({ name: '', email: '', phone: '', company: '', industry: '', relationship: '', notes: '' })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300">🔍</span>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-white text-lg font-medium mb-2">No contacts yet</h3>
          <p className="text-blue-200 mb-4">Add your first contact to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            + Add Contact
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">{contact.name}</div>
                    {contact.company && (
                      <div className="text-blue-200 text-sm">{contact.company}</div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-blue-300">
                      {contact.email && <span>📧 {contact.email}</span>}
                      {contact.phone && <span>📱 {contact.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="px-3 py-1 text-blue-200 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="px-3 py-1 text-red-300 hover:text-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingContact ? 'Edit Contact' : 'Add Contact'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-blue-200 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-blue-200 text-sm mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200 text-sm mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-blue-200 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200 text-sm mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-blue-200 text-sm mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" className="bg-slate-700 text-white">Select...</option>
                    <option value="Insurance" className="bg-slate-700 text-white">Insurance</option>
                    <option value="Real Estate" className="bg-slate-700 text-white">Real Estate</option>
                    <option value="Financial Services" className="bg-slate-700 text-white">Financial Services</option>
                    <option value="Legal" className="bg-slate-700 text-white">Legal</option>
                    <option value="Technology" className="bg-slate-700 text-white">Technology</option>
                    <option value="Marketing" className="bg-slate-700 text-white">Marketing</option>
                    <option value="Healthcare" className="bg-slate-700 text-white">Healthcare</option>
                    <option value="Construction" className="bg-slate-700 text-white">Construction</option>
                    <option value="Other" className="bg-slate-700 text-white">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-blue-200 text-sm mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  {editingContact ? 'Update' : 'Add'} Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}