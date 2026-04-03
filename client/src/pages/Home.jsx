import { Link } from 'react-router-dom'
import { FiBook, FiBriefcase, FiAward, FiUsers, FiTrendingUp, FiGlobe, FiArrowRight } from 'react-icons/fi'

const features = [
  {
    icon: FiBook,
    title: 'Cloud Training',
    description: 'Expert-led courses on AWS, Azure, GCP, and multi-cloud architecture. From foundations to advanced specializations.',
    color: 'cyan',
  },
  {
    icon: FiBriefcase,
    title: 'FinOps Consulting',
    description: 'Optimize your cloud spend with our FinOps experts. Cost analysis, right-sizing, and governance frameworks.',
    color: 'purple',
  },
  {
    icon: FiAward,
    title: 'Certification Prep',
    description: 'Structured programs for AWS, Azure, and GCP certifications with practice exams and hands-on labs.',
    color: 'cyan',
  },
]

const stats = [
  { value: '5,000+', label: 'Students Trained', icon: FiUsers },
  { value: '150+', label: 'Courses Available', icon: FiBook },
  { value: '98%', label: 'Satisfaction Rate', icon: FiTrendingUp },
  { value: '40+', label: 'Countries Reached', icon: FiGlobe },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-cyan mb-8">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              Now offering FinOps Foundation certification prep
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
              <span className="gradient-text">Cloud Training</span>
              <br />
              <span className="text-white">&amp; FinOps Consulting</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Accelerate your cloud career with expert-led training programs and
              optimize your organization's cloud investment with proven FinOps strategies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan to-cyan-dark text-primary font-semibold text-lg hover:shadow-lg hover:shadow-cyan/25 transition-all duration-300"
              >
                Explore Courses <FiArrowRight />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-purple/40 text-purple-light font-semibold text-lg hover:bg-purple/10 transition-all duration-300"
              >
                Our Services <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to <span className="gradient-text">master the cloud</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Comprehensive programs designed for individuals and enterprises at every stage of their cloud journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group glass glass-hover rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    feature.color === 'cyan'
                      ? 'bg-cyan/10 text-cyan'
                      : 'bg-purple/10 text-purple-light'
                  }`}
                >
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-cyan/10 text-cyan flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={22} />
                </div>
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan/10 to-purple/10" />
            <div className="absolute inset-0 glass" />
            <div className="relative px-8 sm:px-16 py-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to accelerate your cloud career?
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                Join thousands of professionals who have transformed their careers with CloudAIP's training and consulting services.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan to-purple text-white font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Start Learning Today <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
