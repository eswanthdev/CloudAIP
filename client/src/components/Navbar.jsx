import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiHome, FiBook, FiBriefcase, FiUser, FiLogOut, FiGrid } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-cyan bg-cyan/10'
        : 'text-slate-300 hover:text-cyan hover:bg-white/5'
    }`

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center font-bold text-white text-sm">
              CA
            </div>
            <span className="text-xl font-bold gradient-text">CloudAIP</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              <FiHome size={16} /> Home
            </NavLink>
            <NavLink to="/courses" className={navLinkClass}>
              <FiBook size={16} /> Courses
            </NavLink>
            <NavLink to="/services" className={navLinkClass}>
              <FiBriefcase size={16} /> Services
            </NavLink>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <FiGrid size={16} /> Admin
                  </NavLink>
                )}
                <NavLink to="/dashboard" className={navLinkClass}>
                  <FiGrid size={16} /> Dashboard
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-xs font-semibold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan to-purple text-white hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-cyan hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/5">
          <div className="px-4 py-4 space-y-1">
            <NavLink to="/" className={navLinkClass} end onClick={() => setMobileOpen(false)}>
              <FiHome size={16} /> Home
            </NavLink>
            <NavLink to="/courses" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <FiBook size={16} /> Courses
            </NavLink>
            <NavLink to="/services" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <FiBriefcase size={16} /> Services
            </NavLink>

            <div className="border-t border-white/10 my-2 pt-2">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                      <FiGrid size={16} /> Admin
                    </NavLink>
                  )}
                  <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                    <FiGrid size={16} /> Dashboard
                  </NavLink>
                  <NavLink to="/profile" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                    <FiUser size={16} /> Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <FiLogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-cyan"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-sm font-medium text-cyan"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
