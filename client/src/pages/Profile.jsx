import { useState } from 'react'
import { FiUser, FiMail, FiSave, FiLock } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    company: user?.company || '',
    jobTitle: user?.jobTitle || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    await updateProfile(profileData)
    setSavingProfile(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSavingPassword(true)
    try {
      await apiClient.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      toast.success('Password updated!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-primary-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 transition-all text-sm'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">
        My <span className="gradient-text">Profile</span>
      </h1>
      <p className="text-slate-400 mb-8">Manage your account settings and preferences.</p>

      {/* Avatar */}
      <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-2xl font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{user?.name || 'User'}</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan/10 text-cyan capitalize">
            {user?.role || 'student'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {[
          { id: 'profile', label: 'Profile', icon: FiUser },
          { id: 'password', label: 'Password', icon: FiLock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan/10 text-cyan'
                : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="glass rounded-2xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={profileData.jobTitle}
                onChange={handleProfileChange}
                placeholder="Cloud Architect"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
              <input
                type="text"
                name="company"
                value={profileData.company}
                onChange={handleProfileChange}
                placeholder="Acme Inc."
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan to-cyan-dark text-primary font-semibold hover:shadow-lg hover:shadow-cyan/25 transition-all disabled:opacity-50"
          >
            {savingProfile ? <LoadingSpinner size="sm" /> : <><FiSave size={14} /> Save Changes</>}
          </button>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="glass rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              required
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple to-purple-dark text-white font-semibold hover:shadow-lg hover:shadow-purple/25 transition-all disabled:opacity-50"
          >
            {savingPassword ? <LoadingSpinner size="sm" /> : <><FiLock size={14} /> Update Password</>}
          </button>
        </form>
      )}
    </div>
  )
}
