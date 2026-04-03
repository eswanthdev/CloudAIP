import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3.js';
import { Certificate, Enrollment, Course, User, Progress, Lesson } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export async function generateCertificatePDF(
  userId: string,
  courseId: string
): Promise<string> {
  // Verify enrollment is completed
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    status: 'completed',
  });

  if (!enrollment) {
    throw new AppError('Course must be completed to generate a certificate', 400);
  }

  // Check if certificate already exists
  const existingCert = await Certificate.findOne({
    user: userId,
    course: courseId,
  });

  if (existingCert) {
    return existingCert._id.toString();
  }

  const user = await User.findById(userId);
  const course = await Course.findById(courseId);

  if (!user || !course) {
    throw new AppError('User or course not found', 404);
  }

  const certificateNumber = `CAIP-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Generate a simple HTML certificate and convert to a text-based PDF representation
  const certificateContent = generateCertificateHTML(
    user.firstName,
    user.lastName,
    course.title,
    certificateNumber,
    new Date()
  );

  // Upload to S3
  const pdfKey = `certificates/${certificateNumber}.html`;
  await uploadToS3(pdfKey, Buffer.from(certificateContent, 'utf-8'), 'text/html');

  const certificate = await Certificate.create({
    user: userId,
    course: courseId,
    enrollment: enrollment._id,
    certificateNumber,
    issuedAt: new Date(),
    pdfKey,
  });

  return certificate._id.toString();
}

function generateCertificateHTML(
  firstName: string,
  lastName: string,
  courseTitle: string,
  certificateNumber: string,
  issuedDate: Date
): string {
  const formattedDate = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: 'Georgia', serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 60px;
          text-align: center;
          border: 3px solid #1a365d;
          background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
        }
        .header { color: #1a365d; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px; }
        .title { color: #1a365d; font-size: 36px; margin: 20px 0; font-weight: bold; }
        .subtitle { color: #4a5568; font-size: 18px; margin: 10px 0; }
        .name { color: #2d3748; font-size: 28px; font-style: italic; margin: 30px 0 10px; border-bottom: 2px solid #3182ce; display: inline-block; padding-bottom: 5px; }
        .course { color: #2d3748; font-size: 22px; margin: 20px 0; }
        .meta { color: #718096; font-size: 12px; margin-top: 40px; }
        .cert-number { color: #a0aec0; font-size: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">CloudAIP Academy</div>
      <div class="title">Certificate of Completion</div>
      <div class="subtitle">This is to certify that</div>
      <div class="name">${firstName} ${lastName}</div>
      <div class="subtitle">has successfully completed the course</div>
      <div class="course">${courseTitle}</div>
      <div class="meta">Issued on ${formattedDate}</div>
      <div class="cert-number">Certificate No: ${certificateNumber}</div>
    </body>
    </html>
  `;
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

export async function checkCourseCompletion(
  userId: string,
  courseId: string
): Promise<boolean> {
  const totalLessons = await Lesson.countDocuments({ course: courseId });
  if (totalLessons === 0) return false;

  const completedLessons = await Progress.countDocuments({
    user: userId,
    course: courseId,
    isCompleted: true,
  });

  return completedLessons >= totalLessons;
}
