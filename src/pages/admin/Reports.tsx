import React, { useState } from 'react';
import { Layout } from '../../components/shared/Layout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Download, FileText, Calendar, Users, Filter } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export const AdminReports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
  setIsGenerating(true);
  try {
    const response = await adminService.generateReport(data);

    const blob = new Blob([response], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Report downloaded successfully!');
  } catch (error) {
    toast.error('Failed to generate report.');
  } finally {
    setIsGenerating(false);
  }
  };


  return (
    <Layout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        </div>

        {/* Report Generation Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Generate Report
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  {...register('report_type', { required: 'Report type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Report Type</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="employee">Employee Report</option>
                  <option value="department">Department Report</option>
                  <option value="overtime">Overtime Report</option>
                </select>
                {errors.report_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.report_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  {...register('from_date', { required: 'From date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.from_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.from_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  {...register('to_date', { required: 'To date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.to_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.to_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department (Optional)
                </label>
                <select
                  {...register('department_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="hr">Human Resources</option>
                  <option value="finance">Finance</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  {...register('format', { required: 'Format is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
                {errors.format && (
                  <p className="mt-1 text-sm text-red-600">{errors.format.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                icon={Download}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Quick Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Today's Attendance</h4>
                  <p className="text-sm text-gray-600">Current day attendance summary</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Weekly Summary</h4>
                  <p className="text-sm text-gray-600">This week's attendance report</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Monthly Report</h4>
                  <p className="text-sm text-gray-600">Complete monthly attendance</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Attendance Report - December 2024</p>
                  <p className="text-xs text-gray-500">Generated 2 hours ago</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Employee Report - Engineering Dept</p>
                  <p className="text-xs text-gray-500">Generated 1 day ago</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Overtime Report - Q4 2024</p>
                  <p className="text-xs text-gray-500">Generated 3 days ago</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};