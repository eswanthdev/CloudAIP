import { Request, Response, NextFunction } from 'express';
import { User, Course, Enrollment, Payment, Lead, ServiceRequest, Service } from '../models/index.js';
import { success } from '../utils/apiResponse.js';

export async function getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      totalStudents,
      totalClients,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalRevenue,
      totalLeads,
      newLeads,
      totalServiceRequests,
      totalServices,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'client' }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: 'active' }),
      Enrollment.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then((r) => r[0]?.total || 0),
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'new' }),
      ServiceRequest.countDocuments(),
      Service.countDocuments({ isPublished: true }),
    ]);

    success(res, {
      users: { total: totalUsers, students: totalStudents, clients: totalClients },
      courses: { total: totalCourses, published: publishedCourses },
      enrollments: { total: totalEnrollments, active: activeEnrollments, completed: completedEnrollments },
      revenue: { total: totalRevenue, currency: 'usd' },
      leads: { total: totalLeads, new: newLeads },
      serviceRequests: { total: totalServiceRequests },
      services: { total: totalServices },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [recentEnrollments, recentPayments, recentLeads, recentServiceRequests] = await Promise.all([
      Enrollment.find()
        .populate('user', 'firstName lastName email')
        .populate('course', 'title slug')
        .sort({ createdAt: -1 })
        .limit(10),
      Payment.find({ status: 'succeeded' })
        .populate('user', 'firstName lastName email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      Lead.find().sort({ createdAt: -1 }).limit(10),
      ServiceRequest.find()
        .populate('service', 'title')
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    success(res, {
      recentEnrollments,
      recentPayments,
      recentLeads,
      recentServiceRequests,
    });
  } catch (err) {
    next(err);
  }
}
