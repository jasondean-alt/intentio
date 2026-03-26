'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface Service {
  id: string
  name: string
  category: string
  description: string | null
  icon: string | null
  referral_link: string | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [iboId, setIboId] = useState<string>('03906474')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Get user's IBO ID
      const { data: profile } = await supabase
        .from('users')
        .select('ibo_id')
        .eq('id', user.id)
        .single()
      
      if (profile?.ibo_id) {
        setIboId(profile.ibo_id)
      }

      // Get services with their referral links
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })
      
      // Get user's custom referral links
      const { data: links } = await supabase
        .from('ibo_service_links')
        .select('*')
        .eq('ibo_id', profile?.ibo_id || '03906474')

      // Merge services with custom links
      const servicesWithLinks = (servicesData || []).map(service => {
        const customLink = links?.find(l => l.service_id === service.id)
        return {
          ...service,
          referral_link: customLink?.referral_link || generateDefaultLink(service, profile?.ibo_id || '03906474')
        }
      })

      setServices(servicesWithLinks)
    }
    setLoading(false)
  }

  const generateDefaultLink = (service: Service, iboId: string): string => {
    switch (service.name.toLowerCase()) {
      case 'mobile':
        return `https://www.flashmobile.com/?iboid=${iboId}`
      case 'energy':
        return `https://acn.xoomenergy.com/en?p=${iboId}`
      case 'health sharing':
        return `https://www1.impacthealthsharing.com/?referral_id=${iboId}`
      case 'idseal':
        return `https://acn.idseal.com/?aff_id=${iboId}`
      default:
        return '#'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Link copied to clipboard!')
  }

  const shareLink = async (service: Service) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${service.name} Referral Link`,
          text: `Check out ${service.name}: ${service.referral_link}`,
          url: service.referral_link || undefined
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      copyToClipboard(service.referral_link || '')
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Services</h1>
        <p className="text-blue-200">Share these links to earn referral credit</p>
      </div>

      {/* IBO ID Display */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-blue-200 text-sm">Your IBO ID</div>
            <div className="text-white font-mono text-lg">{iboId}</div>
          </div>
          <button
            onClick={() => copyToClipboard(iboId)}
            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-2xl">
                  {service.icon === 'smartphone' && '📱'}
                  {service.icon === 'zap' && '⚡'}
                  {service.icon === 'heart' && '❤️'}
                  {service.icon === 'lock' && '🔒'}
                  {!service.icon && '🔗'}
                </div>
                <div>
                  <div className="text-white font-medium">{service.name}</div>
                  <div className="text-blue-200 text-sm">{service.category}</div>
                  {service.description && (
                    <div className="text-blue-300 text-xs mt-1">{service.description}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(service.referral_link || '')}
                  className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => shareLink(service)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                >
                  ↗ Share
                </button>
              </div>
            </div>
            <div className="mt-3 p-2 bg-black/20 rounded-lg">
              <code className="text-blue-200 text-xs break-all">{service.referral_link}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Coming Soon</h2>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center text-2xl opacity-50">
              💳
            </div>
            <div>
              <div className="text-gray-400 font-medium">DingoBlue</div>
              <div className="text-gray-500 text-sm">Available October 2026</div>
            </div>
            <span className="ml-auto px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-sm">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{selectedService.name}</h2>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-blue-200 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-blue-200 mb-4">Scan to visit referral link</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="text-6xl">📱</div>
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => copyToClipboard(selectedService.referral_link || '')}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => shareLink(selectedService)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}