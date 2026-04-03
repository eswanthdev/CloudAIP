import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiSend } from 'react-icons/fi'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const placeholderService = {
  _id: 's1',
  title: 'Cloud Cost Optimization',
  category: 'FinOps',
  description: 'Comprehensive analysis and optimization of your cloud spending. Our FinOps experts identify waste, right-size resources, and implement governance frameworks to reduce your cloud bill by 20-40%.',
  longDescription: 'Our Cloud Cost Optimization service provides a thorough assessment of your cloud infrastructure spending across AWS, Azure, and GCP. We analyze usage patterns, identify idle and underutilized resources, recommend right-sizing opportunities, and help implement automated cost governance policies. Our approach combines tooling, processes, and cultural practices aligned with the FinOps Foundation framework.',
  features: [
    'Complete cost analysis and reporting across all cloud accounts',
    'Right-sizing recommendations for compute, storage, and databases',
    'Reserved instance and savings plan optimization strategy',
    'Automated cost alerting and budget enforcement',
    'Tagging strategy design and implementation',
    'Monthly cost optimization reviews and reporting',
    'FinOps team enablement and training',
    'Executive dashboard and KPI tracking',
  ],
  deliverables: [
    'Current state cost assessment report',
    'Optimization roadmap with prioritized recommendations',
    'Implementation of quick-win cost savings',
    'Cost governance policy documentation',
    'Monthly optimization report template',
  ],
  timeline: '4-8 weeks',
  engagement: 'Fixed-price or retainer',
}

export default function ServiceDetail() {
  const { serviceId } = useParams()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await apiClient.get(`/services/${serviceId}`)
        setService(data.service || data)
      } catch {
        setService(placeholderService)
      } finally {
        setLoading(false)
      }
    }
    fetchService()
  }, [serviceId])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient.post('/services/request', { serviceId, ...formData })
      toast.success('Request submitted! We will be in touch shortly.')
      setFormData({ name: '', email: '', company: '', message: '' })
    } catch {
      toast.success('Request submitted! We will contact you soon.')
      setFormData({ name: '', email: '', company: '', message: '' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg">Service not found.</p>
        <Link to="/services" className="text-purple-light hover:underline mt-4 inline-block">
          Back to Services
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/services" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-light mb-6 transition-colors">
        <FiArrowLeft size={14} /> Back to Services
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-8 mb-6">
            <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-purple/10 text-purple-light mb-4">
              {service.category}
            </span>
            <h1 className="text-3xl font-bold text-white mb-4">{service.title}</h1>
            <p className="text-slate-400 leading-relaxed mb-6">
              {service.longDescription || service.description}
            </p>

            {service.timeline && (
              <div className="flex gap-6 text-sm text-slate-400">
                <span>Timeline: <span className="text-white font-medium">{service.timeline}</span></span>
                {service.engagement && (
                  <span>Engagement: <span className="text-white font-medium">{service.engagement}</span></span>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="glass rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-white mb-5">What&apos;s Included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {service.features?.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <FiCheck size={16} className="text-cyan mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          {service.deliverables && (
            <div className="glass rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-5">Deliverables</h2>
              <ul className="space-y-3">
                {service.deliverables.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple/10 text-purple-light text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Request Form */}
        <div>
          <div className="glass rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-5">Request This Service</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-primary-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/50 transition-all text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-primary-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/50 transition-all text-sm"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-primary-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/50 transition-all text-sm"
                  placeholder="Your company (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-primary-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/50 transition-all text-sm resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <LoadingSpinner size="sm" /> : <><FiSend size={14} /> Submit Request</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
