import { useState, useEffect } from 'react'
import { FiUsers, FiBook, FiDollarSign, FiTrendingUp, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const placeholderStats = {
  totalUsers: 5243,
  totalCourses: 156,
  totalEnrollments: 12480,
  revenue: 384500,
}

const placeholderActivity = [
  { id: 1, user: 'John Smith', action: 'Enrolled in AWS Solutions Architect', date: '2 hours ago' },
  { id: 2, user: 'Maria Garcia', action: 'Completed FinOps Practitioner certification', date: '4 hours ago' },
  { id: 3, user: 'Alex Johnson', action: 'Requested Cloud Cost Optimization service', date: '6 hours ago' },
  { id: 4, user: 'Sarah Williams', action: 'Registered a new account', date: '8 hours ago' },
  { id: 5, user: 'David Brown', action: 'Submitted course review (5 stars)', date: '1 day ago' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.allSettled([
          apiClient.get('/admin/stats'),
          apiClient.get('/admin/activity'),
        ])
        setStats(statsRes.status === 'fulfilled' ? statsRes.value.data : placeholderStats)
        setActivity(activityRes.status === 'fulfilled' ? activityRes.value.data : placeholderActivity)
      } catch {
        setStats(placeholderStats)
        setActivity(placeholderActivity)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString(), icon: FiUsers, color: 'cyan', change: '+12%' },
    { label: 'Total Courses', value: stats?.totalCourses, icon: FiBook, color: 'purple', change: '+3' },
    { label: 'Enrollments', value: stats?.totalEnrollments?.toLocaleString(), icon: FiTrendingUp, color: 'cyan', change: '+8%' },
    { label: 'Revenue', value: `$${(stats?.revenue || 0).toLocaleString()}`, icon: FiDollarSign, color: 'purple', change: '+15%' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400">Platform overview and management.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'cyan' ? 'bg-cyan/10 text-cyan' : 'bg-purple/10 text-purple-light'
              }`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-5">Recent Activity</h2>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activity.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 text-sm text-white font-medium">{item.user}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{item.action}</td>
                    <td className="px-5 py-3 text-sm text-slate-500 whitespace-nowrap">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Create New Course', icon: FiPlus, color: 'cyan' },
              { label: 'Manage Users', icon: FiUsers, color: 'purple' },
              { label: 'Edit Services', icon: FiEdit, color: 'cyan' },
              { label: 'View Reports', icon: FiTrendingUp, color: 'purple' },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-3 glass glass-hover rounded-xl px-4 py-3.5 transition-all duration-200 text-left"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  action.color === 'cyan' ? 'bg-cyan/10 text-cyan' : 'bg-purple/10 text-purple-light'
                }`}>
                  <action.icon size={16} />
                </div>
                <span className="text-sm text-slate-300 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
