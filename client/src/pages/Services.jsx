import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiTrendingDown, FiShield, FiCloud, FiBarChart2, FiSettings, FiDatabase, FiArrowRight } from 'react-icons/fi'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const placeholderServices = [
  {
    _id: 's1',
    title: 'Cloud Cost Optimization',
    description: 'Comprehensive analysis and optimization of your cloud spending. Identify waste, right-size resources, and implement governance.',
    category: 'FinOps',
    icon: 'TrendingDown',
    features: ['Cost analysis & reporting', 'Right-sizing recommendations', 'Reserved instance planning', 'Savings plan optimization'],
  },
  {
    _id: 's2',
    title: 'Cloud Security Assessment',
    description: 'Full security audit of your cloud infrastructure. Identify vulnerabilities, compliance gaps, and implement best practices.',
    category: 'Security',
    icon: 'Shield',
    features: ['Vulnerability scanning', 'Compliance assessment', 'IAM review', 'Security architecture review'],
  },
  {
    _id: 's3',
    title: 'Cloud Migration Strategy',
    description: 'Plan and execute your migration to the cloud with minimal disruption. Assessment, planning, and hands-on migration support.',
    category: 'Migration',
    icon: 'Cloud',
    features: ['Application assessment', 'Migration roadmap', 'Lift-and-shift support', 'Cloud-native refactoring'],
  },
  {
    _id: 's4',
    title: 'FinOps Practice Setup',
    description: 'Build a FinOps practice from the ground up. Establish processes, tooling, and culture for cloud financial management.',
    category: 'FinOps',
    icon: 'BarChart',
    features: ['FinOps maturity assessment', 'Team structure design', 'Tooling selection', 'KPI framework setup'],
  },
  {
    _id: 's5',
    title: 'DevOps & CI/CD Implementation',
    description: 'Modernize your development pipeline with automated CI/CD, infrastructure as code, and monitoring.',
    category: 'DevOps',
    icon: 'Settings',
    features: ['Pipeline design', 'IaC implementation', 'Monitoring setup', 'Release automation'],
  },
  {
    _id: 's6',
    title: 'Data Architecture & Analytics',
    description: 'Design scalable data platforms on the cloud. Data lakes, warehouses, ETL pipelines, and analytics solutions.',
    category: 'Data',
    icon: 'Database',
    features: ['Data lake architecture', 'ETL pipeline design', 'BI dashboard setup', 'ML infrastructure'],
  },
]

const iconMap = {
  TrendingDown: FiTrendingDown,
  Shield: FiShield,
  Cloud: FiCloud,
  BarChart: FiBarChart2,
  Settings: FiSettings,
  Database: FiDatabase,
}

const serviceCategories = ['All', 'FinOps', 'Security', 'Migration', 'DevOps', 'Data']

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await apiClient.get('/services')
        setServices(data.services?.length ? data.services : placeholderServices)
      } catch {
        setServices(placeholderServices)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return services
    return services.filter((s) => s.category === selectedCategory)
  }, [services, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          Our <span className="gradient-text">Services</span>
        </h1>
        <p className="text-slate-400">
          Expert consulting services to optimize, secure, and scale your cloud infrastructure.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-8">
        {serviceCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-purple/10 text-purple-light border border-purple/30'
                : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => {
            const Icon = iconMap[service.icon] || FiCloud
            return (
              <Link
                key={service._id}
                to={`/services/${service._id}`}
                className="group glass glass-hover rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-purple/10 text-purple-light flex items-center justify-center mb-5">
                  <Icon size={24} />
                </div>

                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/5 text-slate-400 mb-3">
                  {service.category}
                </span>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-light transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-400 mb-5 line-clamp-3">{service.description}</p>

                <ul className="space-y-2 mb-5">
                  {service.features?.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-1 h-1 rounded-full bg-cyan flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-1 text-sm text-purple-light font-medium group-hover:underline">
                  Learn More <FiArrowRight size={14} />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 glass rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Need a custom solution?</h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-6">
          Every organization is unique. Contact us for a tailored consulting engagement designed around your specific needs.
        </p>
        <a
          href="mailto:info@cloudaip.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Contact Us <FiArrowRight size={16} />
        </a>
      </div>
    </div>
  )
}
