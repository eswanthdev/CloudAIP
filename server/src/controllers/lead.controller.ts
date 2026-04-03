import { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { sendLeadNotification } from '../services/email.service.js';

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await Lead.create(req.body);

    // Notify admin
    try {
      await sendLeadNotification(lead.name, lead.email, lead.message || 'No message provided');
    } catch {
      console.warn('Failed to send lead notification email');
    }

    success(res, { lead }, 'Thank you for your interest! We will be in touch soon.', 201);
  } catch (err) {
    next(err);
  }
}

export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);

    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;

    if (req.query.search) {
      const search = req.query.search as string;
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Lead.countDocuments(filter),
    ]);

    success(res, { leads }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowedUpdates = ['status', 'notes'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!lead) throw new AppError('Lead not found', 404);

    success(res, { lead }, 'Lead updated');
  } catch (err) {
    next(err);
  }
}
