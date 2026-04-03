import { Link } from 'react-router-dom'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl sm:text-9xl font-extrabold gradient-text mb-4">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-purple text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <FiHome size={16} /> Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 transition-colors"
          >
            <FiArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
