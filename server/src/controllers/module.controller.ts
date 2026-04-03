import { Request, Response, NextFunction } from 'express';
import { Module } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export async function createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;

    // Auto-assign order
    const lastModule = await Module.findOne({ course: courseId }).sort({ order: -1 });
    const order = lastModule ? lastModule.order + 1 : 0;

    const module = await Module.create({
      ...req.body,
      course: courseId,
      order: req.body.order ?? order,
    });

    success(res, { module }, 'Module created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, description: req.body.description },
      { new: true, runValidators: true }
    );

    if (!module) {
      throw new AppError('Module not found', 404);
    }

    success(res, { module }, 'Module updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const module = await Module.findByIdAndDelete(req.params.id);
    if (!module) {
      throw new AppError('Module not found', 404);
    }

    // Re-order remaining modules
    await Module.updateMany(
      { course: module.course, order: { $gt: module.order } },
      { $inc: { order: -1 } }
    );

    success(res, null, 'Module deleted');
  } catch (err) {
    next(err);
  }
}

export async function reorderModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const { moduleIds } = req.body as { moduleIds: string[] };

    if (!Array.isArray(moduleIds)) {
      throw new AppError('moduleIds must be an array', 400);
    }

    const bulkOps = moduleIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, course: courseId },
        update: { order: index },
      },
    }));

    await Module.bulkWrite(bulkOps);

    const modules = await Module.find({ course: courseId }).sort({ order: 1 });
    success(res, { modules }, 'Modules reordered');
  } catch (err) {
    next(err);
  }
}
