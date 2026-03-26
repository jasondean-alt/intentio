'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface Referral {
  id: string
  status: string
  client_name: string
  notes: string | null
  fee_type: string | null
  fee_amount: number | null
  created_at: string
  contact: {
    full_name: string
    email: string | null
    phone: string | null
  }[] | null
  service: {
    name: string
    category: string
  }[] | null
}

interface Contact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
}

interface Service {
  id: string
  name: string
  category: string
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    contact_id: '',
    service_id: '',
    client_name: '',
    notes: '',
    fee_type: 'percentage',
    fee_amount: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Fetch referrals with contact and service info
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          client_name,
          notes,
          fee_type,
          fee_amount,
          created_at,
          contact:contacts!referrals_contact_id_fkey (full_name, email, phone),
          service:services (name, category)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      setReferrals(referralsData || [])

      // Fetch contacts for dropdown
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, full_name, email, phone')
        .eq('user_id', user.id)

      setContacts(contactsData || [])

      // Fetch services for dropdown
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, category')
        .order('display_order')

      setServices(servicesData || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('referrals').insert({
      sender_id: user.id,
      contact_id: formData.contact_id || null,
      service_id: formData.service_id || null,
      client_name: formData.client_name,
      notes: formData.notes || null,
      fee_type: formData.fee_type,
      fee_amount: formData.fee_amount ? parseFloat(formData.fee_amount) : null,
      status: 'sent'
    })

    setShowModal(false)
    setFormData({
      contact_id: '',
      service_id: '',
      client_name: '',
      notes: '',
      fee_type: 'percentage',
      fee_amount: ''
    })
    fetchData()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('referrals')
      .update({ status })
      .eq('id', id)
    fetchData()
  }

  const filteredReferrals = referrals.filter(r => {
    if (activeTab === 'all') return true
    return r.status === activeTab
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300'
      case 'sent': return 'bg-blue-500/20 text-blue-300'
      case 'accepted': return 'bg-green-500/20 text-green-300'
      case 'completed': return 'bg-emerald-500/20 text-emerald-300'
      case 'declined': return 'bg-red-500/20 text-red-300'
      default: return 'bg-gray-500/20 text-gray-300'
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
          <h1 className="text-2xl font-bold text-white">Referrals</h1>
          <p className="text-blue-200">{referrals.length} referral{referrals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
        >
          + Send Referral
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'sent', 'received'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Referral List */}
      {filteredReferrals.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-white text-lg font-medium mb-2">No referrals yet</h3>
          <p className="text-blue-200 mb-4">Send your first referral to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            + Send Referral
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map((referral) => (
            <div
              key={referral.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {referral.status}
                    </span>
                    <span className="text-blue-300 text-sm">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-white font-medium">{referral.client_name}</div>
                  {referral.contact && referral.contact[0] && (
                    <div className="text-blue-200 text-sm mt-1">
                      To: {referral.contact[0].full_name}
                      {referral.contact[0].email && ` (${referral.contact[0].email})`}
                    </div>
                  )}
                  {referral.service && referral.service[0] && (
                    <div className="text-blue-300 text-sm">
                      Service: {referral.service[0].name}
                    </div>
                  )}
                  {referral.notes && (
                    <div className="text-blue-300 text-sm mt-2 italic">"{referral.notes}"</div>
                  )}
                  {referral.fee_amount && (
                    <div className="text-green-300 text-sm mt-1">
                      Fee: {referral.fee_type === 'percentage' ? `${referral.fee_amount}%` : `$${referral.fee_amount}`}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {referral.status === 'sent' && (
                    <>
                      <button
                        onClick={() => updateStatus(referral.id, 'accepted')}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(referral.id, 'declined')}
                        className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 text-sm"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {referral.status === 'accepted' && (
                    <button
                      onClick={() => updateStatus(referral.id, 'completed')}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 text-sm"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Referral Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Send Referral</h2>
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
                <label className="block text-blue-200 text-sm mb-1">Contact</label>
                <select
                  value={formData.contact_id}
                  onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name} {contact.email && `(${contact.email})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-blue-200 text-sm mb-1">Service</label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-blue-200 text-sm mb-1">Client / Opportunity Name *</label>
                <input
                  type="text"
                  required
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="e.g. John Smith - Home Buyer"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-blue-200 text-sm mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What do they need? Timeline? Budget?"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200 text-sm mb-1">Fee Type</label>
                  <select
                    value={formData.fee_type}
                    onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="percentage">% of deal</option>
                    <option value="flat">Flat fee ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-blue-200 text-sm mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                    placeholder="25"
                    min="0"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  Send Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}