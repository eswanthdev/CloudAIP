import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiClock, FiUsers, FiStar, FiChevronDown, FiChevronUp, FiPlay, FiCheck, FiLock, FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const placeholderCourse = {
  _id: '1',
  title: 'AWS Solutions Architect Associate',
  description: 'Master AWS services and architecture best practices. This comprehensive course covers all domains required for the SAA-C03 certification exam, including designing resilient architectures, high-performing architectures, secure applications, and cost-optimized architectures.',
  category: 'AWS',
  tier: 'Professional',
  price: 299,
  duration: '40 hours',
  studentsEnrolled: 1240,
  rating: 4.8,
  instructor: 'Dr. Sarah Chen',
  modules: [
    {
      _id: 'm1',
      title: 'Cloud Fundamentals',
      lessons: [
        { _id: 'l1', title: 'Introduction to Cloud Computing', duration: '15 min', type: 'video' },
        { _id: 'l2', title: 'AWS Global Infrastructure', duration: '20 min', type: 'video' },
        { _id: 'l3', title: 'IAM and Security Basics', duration: '25 min', type: 'video' },
      ],
    },
    {
      _id: 'm2',
      title: 'Compute Services',
      lessons: [
        { _id: 'l4', title: 'EC2 Instances Deep Dive', duration: '30 min', type: 'video' },
        { _id: 'l5', title: 'Lambda and Serverless', duration: '25 min', type: 'video' },
        { _id: 'l6', title: 'ECS and Container Services', duration: '20 min', type: 'video' },
        { _id: 'l7', title: 'Compute Quiz', duration: '15 min', type: 'quiz' },
      ],
    },
    {
      _id: 'm3',
      title: 'Networking & Content Delivery',
      lessons: [
        { _id: 'l8', title: 'VPC Architecture', duration: '35 min', type: 'video' },
        { _id: 'l9', title: 'Route 53 and DNS', duration: '20 min', type: 'video' },
        { _id: 'l10', title: 'CloudFront CDN', duration: '15 min', type: 'video' },
      ],
    },
    {
      _id: 'm4',
      title: 'Storage & Databases',
      lessons: [
        { _id: 'l11', title: 'S3 and Storage Classes', duration: '25 min', type: 'video' },
        { _id: 'l12', title: 'RDS and Aurora', duration: '30 min', type: 'video' },
        { _id: 'l13', title: 'DynamoDB', duration: '20 min', type: 'video' },
        { _id: 'l14', title: 'Storage Quiz', duration: '15 min', type: 'quiz' },
      ],
    },
  ],
}

export default function CourseDetail() {
  const { courseId } = useParams()
  const { isAuthenticated } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expandedModules, setExpandedModules] = useState({})

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await apiClient.get(`/courses/${courseId}`)
        setCourse(data.course || data)
        setEnrolled(data.enrolled || false)
        setProgress(data.progress || 0)
      } catch {
        setCourse(placeholderCourse)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to enroll')
      return
    }
    setEnrolling(true)
    try {
      await apiClient.post(`/enrollments`, { courseId })
      setEnrolled(true)
      toast.success('Successfully enrolled!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg">Course not found.</p>
        <Link to="/courses" className="text-cyan hover:underline mt-4 inline-block">
          Back to Courses
        </Link>
      </div>
    )
  }

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan mb-6 transition-colors">
        <FiArrowLeft size={14} /> Back to Courses
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="glass rounded-2xl p-8 mb-6">
            <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-cyan/10 text-cyan mb-4">
              {course.category} &middot; {course.tier}
            </span>
            <h1 className="text-3xl font-bold text-white mb-4">{course.title}</h1>
            <p className="text-slate-400 leading-relaxed mb-6">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <FiClock size={14} className="text-cyan" /> {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <FiUsers size={14} className="text-cyan" /> {course.studentsEnrolled?.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1.5">
                <FiStar size={14} className="text-yellow-500" /> {course.rating} rating
              </span>
              {course.instructor && (
                <span className="text-slate-300">by {course.instructor}</span>
              )}
            </div>

            {/* Progress bar (if enrolled) */}
            {enrolled && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Your Progress</span>
                  <span className="text-sm font-medium text-cyan">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-primary-dark overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-purple progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modules */}
          <h2 className="text-xl font-semibold text-white mb-4">
            Course Content
            <span className="text-sm font-normal text-slate-400 ml-2">
              {course.modules?.length || 0} modules &middot; {totalLessons} lessons
            </span>
          </h2>

          <div className="space-y-3">
            {course.modules?.map((module) => (
              <div key={module._id} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleModule(module._id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{module.title}</span>
                    <span className="text-xs text-slate-500">{module.lessons?.length || 0} lessons</span>
                  </div>
                  {expandedModules[module._id] ? (
                    <FiChevronUp className="text-slate-400" size={18} />
                  ) : (
                    <FiChevronDown className="text-slate-400" size={18} />
                  )}
                </button>

                {expandedModules[module._id] && (
                  <div className="border-t border-white/5">
                    {module.lessons?.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-dark">
                          {enrolled ? (
                            <FiPlay size={12} className="text-cyan" />
                          ) : (
                            <FiLock size={12} className="text-slate-500" />
                          )}
                        </div>
                        <span className="text-sm text-slate-300 flex-1">{lesson.title}</span>
                        <span className="text-xs text-slate-500">{lesson.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="glass rounded-2xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-white mb-1">
                {course.price === 0 ? (
                  <span className="text-green-400">Free</span>
                ) : (
                  `$${course.price}`
                )}
              </div>
              {course.price > 0 && (
                <p className="text-sm text-slate-500">One-time payment</p>
              )}
            </div>

            {enrolled ? (
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan to-cyan-dark text-primary font-semibold flex items-center justify-center gap-2">
                <FiPlay size={16} /> Continue Learning
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan to-purple text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enrolling ? <LoadingSpinner size="sm" /> : 'Enroll Now'}
              </button>
            )}

            <div className="mt-6 space-y-3 text-sm">
              {[
                `${totalLessons} lessons`,
                `${course.duration} of content`,
                'Lifetime access',
                'Certificate of completion',
                'Hands-on projects',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-400">
                  <FiCheck size={14} className="text-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
