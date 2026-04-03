import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiFilter, FiClock, FiUsers, FiStar } from 'react-icons/fi'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const placeholderCourses = [
  {
    _id: '1',
    title: 'AWS Solutions Architect Associate',
    description: 'Master AWS services and architecture best practices. Prepare for the SAA-C03 certification exam.',
    category: 'AWS',
    tier: 'Professional',
    price: 299,
    duration: '40 hours',
    studentsEnrolled: 1240,
    rating: 4.8,
    thumbnail: null,
  },
  {
    _id: '2',
    title: 'Azure Fundamentals AZ-900',
    description: 'Learn core Azure concepts, services, and management tools. Perfect for beginners starting their cloud journey.',
    category: 'Azure',
    tier: 'Foundation',
    price: 0,
    duration: '15 hours',
    studentsEnrolled: 3400,
    rating: 4.6,
    thumbnail: null,
  },
  {
    _id: '3',
    title: 'FinOps Certified Practitioner',
    description: 'Learn cloud financial management fundamentals. Understand the FinOps framework, principles, and best practices.',
    category: 'FinOps',
    tier: 'Professional',
    price: 399,
    duration: '30 hours',
    studentsEnrolled: 890,
    rating: 4.9,
    thumbnail: null,
  },
  {
    _id: '4',
    title: 'GCP Cloud Engineer',
    description: 'Deploy applications, monitor operations, and manage enterprise solutions on Google Cloud Platform.',
    category: 'GCP',
    tier: 'Professional',
    price: 349,
    duration: '35 hours',
    studentsEnrolled: 760,
    rating: 4.7,
    thumbnail: null,
  },
  {
    _id: '5',
    title: 'Kubernetes Administration',
    description: 'Deep dive into Kubernetes cluster management, deployments, networking, and security.',
    category: 'DevOps',
    tier: 'Advanced',
    price: 449,
    duration: '45 hours',
    studentsEnrolled: 520,
    rating: 4.8,
    thumbnail: null,
  },
  {
    _id: '6',
    title: 'Terraform Infrastructure as Code',
    description: 'Automate cloud infrastructure provisioning with Terraform. Multi-cloud IaC patterns and best practices.',
    category: 'DevOps',
    tier: 'Professional',
    price: 279,
    duration: '25 hours',
    studentsEnrolled: 980,
    rating: 4.7,
    thumbnail: null,
  },
]

const categories = ['All', 'AWS', 'Azure', 'GCP', 'FinOps', 'DevOps']

const tierColors = {
  Foundation: 'bg-green-500/10 text-green-400',
  Professional: 'bg-cyan/10 text-cyan',
  Advanced: 'bg-purple/10 text-purple-light',
}

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await apiClient.get('/courses')
        setCourses(data.courses?.length ? data.courses : placeholderCourses)
      } catch {
        setCourses(placeholderCourses)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [courses, search, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          Explore <span className="gradient-text">Courses</span>
        </h1>
        <p className="text-slate-400">Master cloud technologies with expert-led training programs.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-primary-light border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FiFilter className="text-slate-500 flex-shrink-0" size={16} />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan/10 text-cyan border border-cyan/30'
                  : 'text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No courses found matching your criteria.</p>
        </div>
      ) : (
        /* Course Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="group glass glass-hover rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              {/* Thumbnail placeholder */}
              <div className="h-40 bg-gradient-to-br from-primary-light to-primary-dark flex items-center justify-center">
                <span className="text-4xl font-bold gradient-text opacity-50">
                  {course.category}
                </span>
              </div>

              <div className="p-5">
                {/* Tier badge */}
                <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium mb-3 ${tierColors[course.tier] || tierColors.Professional}`}>
                  {course.tier}
                </span>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <FiClock size={12} /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers size={12} /> {course.studentsEnrolled?.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiStar size={12} className="text-yellow-500" /> {course.rating}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-lg font-bold text-white">
                    {course.price === 0 ? (
                      <span className="text-green-400">Free</span>
                    ) : (
                      `$${course.price}`
                    )}
                  </span>
                  <span className="text-sm text-cyan font-medium group-hover:underline">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
