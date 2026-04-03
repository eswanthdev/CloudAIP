import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBook, FiAward, FiClock, FiArrowRight, FiPlay } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

// Placeholder data used when API is unavailable
const placeholderCourses = [
  { _id: '1', course: { title: 'AWS Solutions Architect', thumbnail: null }, progress: 72, lastAccessed: new Date().toISOString() },
  { _id: '2', course: { title: 'Azure Fundamentals', thumbnail: null }, progress: 45, lastAccessed: new Date().toISOString() },
  { _id: '3', course: { title: 'FinOps Certified Practitioner', thumbnail: null }, progress: 18, lastAccessed: new Date().toISOString() },
]

const placeholderActivity = [
  { id: 1, type: 'lesson', text: 'Completed "VPC Networking" in AWS Solutions Architect', time: '2 hours ago' },
  { id: 2, type: 'quiz', text: 'Scored 85% on Azure Fundamentals Quiz 3', time: '1 day ago' },
  { id: 3, type: 'enroll', text: 'Enrolled in FinOps Certified Practitioner', time: '3 days ago' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, activityRes] = await Promise.allSettled([
          apiClient.get('/enrollments/my'),
          apiClient.get('/activity/recent'),
        ])
        setEnrollments(enrollRes.status === 'fulfilled' ? enrollRes.value.data : placeholderCourses)
        setActivity(activityRes.status === 'fulfilled' ? activityRes.value.data : placeholderActivity)
      } catch {
        setEnrollments(placeholderCourses)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, <span className="gradient-text">{user?.name || 'Learner'}</span>
        </h1>
        <p className="text-slate-400">Continue where you left off or explore new courses.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: FiBook, label: 'Enrolled Courses', value: enrollments.length, color: 'cyan' },
          { icon: FiAward, label: 'Certificates Earned', value: 0, color: 'purple' },
          { icon: FiClock, label: 'Hours Learned', value: 24, color: 'cyan' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
              stat.color === 'cyan' ? 'bg-cyan/10 text-cyan' : 'bg-purple/10 text-purple-light'
            }`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">My Courses</h2>
            <Link to="/courses" className="text-sm text-cyan hover:underline flex items-center gap-1">
              Browse All <FiArrowRight size={14} />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="glass rounded-xl p-10 text-center">
              <FiBook className="mx-auto mb-4 text-slate-500" size={40} />
              <p className="text-slate-400 mb-4">You haven&apos;t enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan/10 text-cyan text-sm font-medium hover:bg-cyan/20 transition-colors"
              >
                Explore Courses <FiArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="glass glass-hover rounded-xl p-5 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">
                      {enrollment.course?.title || 'Untitled Course'}
                    </h3>
                    <Link
                      to={`/courses/${enrollment.course?._id || enrollment._id}`}
                      className="text-cyan hover:bg-cyan/10 p-2 rounded-lg transition-colors"
                    >
                      <FiPlay size={16} />
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-primary-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan to-purple progress-bar"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-cyan min-w-[3rem] text-right">
                      {enrollment.progress || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-5">Recent Activity</h2>
          <div className="glass rounded-xl divide-y divide-white/5">
            {activity.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No recent activity</div>
            ) : (
              activity.map((item) => (
                <div key={item.id || item._id} className="p-4">
                  <p className="text-sm text-slate-300 mb-1">{item.text}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Links */}
          <h2 className="text-xl font-semibold text-white mt-8 mb-5">Quick Links</h2>
          <div className="space-y-2">
            {[
              { to: '/courses', label: 'Browse Courses', icon: FiBook },
              { to: '/services', label: 'View Services', icon: FiAward },
              { to: '/profile', label: 'Edit Profile', icon: FiClock },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 glass glass-hover rounded-xl px-4 py-3 transition-all duration-200"
              >
                <link.icon size={16} className="text-cyan" />
                <span className="text-sm text-slate-300">{link.label}</span>
                <FiArrowRight size={14} className="ml-auto text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
