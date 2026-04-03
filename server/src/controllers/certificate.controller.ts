import { Request, Response, NextFunction } from 'express';
import { Certificate } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { generateCertificatePDF } from '../services/certificate.service.js';
import { getSignedDownloadUrl } from '../services/s3.service.js';

export async function generateCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { courseId } = req.params;
    const certificateId = await generateCertificatePDF(req.user._id.toString(), courseId);

    const certificate = await Certificate.findById(certificateId)
      .populate('course', 'title slug')
      .populate('user', 'firstName lastName');

    success(res, { certificate }, 'Certificate generated', 201);
  } catch (err) {
    next(err);
  }
}

export async function getCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const filter: Record<string, unknown> = {};
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    const certificates = await Certificate.find(filter)
      .populate('course', 'title slug thumbnail')
      .populate('user', 'firstName lastName email')
      .sort({ issuedAt: -1 });

    success(res, { certificates });
  } catch (err) {
    next(err);
  }
}

export async function getCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course', 'title slug')
      .populate('user', 'firstName lastName');

    if (!certificate) throw new AppError('Certificate not found', 404);

    success(res, { certificate });
  } catch (err) {
    next(err);
  }
}

export async function downloadCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) throw new AppError('Certificate not found', 404);

    if (!certificate.pdfKey) {
      throw new AppError('Certificate file not available', 404);
    }

    const downloadUrl = await getSignedDownloadUrl(certificate.pdfKey, 3600);
    success(res, { downloadUrl });
  } catch (err) {
    next(err);
  }
}

export async function verifyCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({ certificateNumber })
      .populate('course', 'title slug')
      .populate('user', 'firstName lastName');

    if (!certificate) {
      throw new AppError('Certificate not found or invalid', 404);
    }

    success(res, {
      valid: true,
      certificate,
    });
  } catch (err) {
    next(err);
  }
}
