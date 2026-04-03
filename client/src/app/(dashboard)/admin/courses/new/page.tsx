'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    level: 'beginner',
    price: '',
    duration: '',
    instructor: '',
    tags: '',
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('shortDescription', form.shortDescription);
      formData.append('category', form.category);
      formData.append('level', form.level);
      formData.append('price', form.price || '0');
      formData.append('duration', form.duration || '0');
      formData.append('instructor', form.instructor);
      formData.append('tags', form.tags);
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      await api.post('/admin/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Course created successfully!');
      router.push('/admin/courses');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-cyan transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Create New Course</h1>
        <p className="text-text-muted mt-1">Fill in the details to create a new training course</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Course Title *"
            name="title"
            placeholder="e.g., AWS Solutions Architect Associate"
            value={form.title}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-text-light mb-1.5">Description *</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Detailed course description..."
              value={form.description}
              onChange={handleChange}
              className="w-full bg-navy-900 border border-border rounded-lg px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50 transition-all duration-200 resize-none"
            />
          </div>

          <Input
            label="Short Description"
            name="shortDescription"
            placeholder="Brief one-liner about the course"
            value={form.shortDescription}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-light mb-1.5">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-navy-900 border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan/50"
              >
                <option value="">Select category</option>
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="GCP">GCP</option>
                <option value="DevOps">DevOps</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Security">Security</option>
                <option value="Data">Data Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light mb-1.5">Level</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full bg-navy-900 border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan/50"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (USD)"
              name="price"
              type="number"
              placeholder="0"
              value={form.price}
              onChange={handleChange}
            />
            <Input
              label="Duration (hours)"
              name="duration"
              type="number"
              placeholder="0"
              value={form.duration}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Instructor"
            name="instructor"
            placeholder="Instructor name"
            value={form.instructor}
            onChange={handleChange}
          />

          <Input
            label="Tags (comma-separated)"
            name="tags"
            placeholder="aws, cloud, certification"
            value={form.tags}
            onChange={handleChange}
          />

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-text-light mb-1.5">Thumbnail</label>
            <label className="flex flex-col items-center justify-center w-full h-32 bg-navy-900 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-cyan/30 transition-colors">
              <Upload className="h-6 w-6 text-text-muted mb-2" />
              <span className="text-sm text-text-muted">
                {thumbnail ? thumbnail.name : 'Click to upload thumbnail'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Create Course
            </Button>
            <Link href="/admin/courses">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
