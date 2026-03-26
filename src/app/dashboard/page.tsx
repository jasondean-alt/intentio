'use client'

import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ReferralStats {
  total: number
  pending: number
  completed: number
  contacts: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<ReferralStats>({ total: 0, pending: 0, completed: 0, contacts: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)

        // Fetch referral stats
        const { data: referrals } = await supabase
          .from('referrals')
          .select('status')
          .eq('sender_id', user.id)
        
        const { count: contactsCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (referrals) {
          setStats({
            total: referrals.length,
            pending: referrals.filter(r => r.status === 'pending' || r.status === 'sent').length,
            completed: referrals.filter(r => r.status === 'completed').length,
            contacts: contactsCount || 0
          })
        }
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-blue-200">Here's what's happening with your referrals.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20">
          <div className="text-blue-200 text-sm mb-1">Total Referrals</div>
          <div className="text-2xl lg:text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20">
          <div className="text-blue-200 text-sm mb-1">Pending</div>
          <div className="text-2xl lg:text-3xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20">
          <div className="text-blue-200 text-sm mb-1">Completed</div>
          <div className="text-2xl lg:text-3xl font-bold text-green-400">{stats.completed}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20">
          <div className="text-blue-200 text-sm mb-1">Contacts</div>
          <div className="text-2xl lg:text-3xl font-bold text-purple-400">{stats.contacts}</div>
        </div>
      </div>

      {/* IBO Banner */}
      {profile?.is_ibo && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <div className="text-white font-semibold">ACN IBO Account</div>
              <div className="text-green-200 text-sm">IBO ID: {profile.ibo_id}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/contacts"
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <div className="text-white font-medium">Manage Contacts</div>
              <div className="text-blue-200 text-sm">Add and organize your network</div>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/referrals"
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <div className="text-white font-medium">Send Referrals</div>
              <div className="text-blue-200 text-sm">Share services with contacts</div>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/services"
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
              <span className="text-2xl">🔗</span>
            </div>
            <div>
              <div className="text-white font-medium">View Services</div>
              <div className="text-blue-200 text-sm">Browse available services</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}