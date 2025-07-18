import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/shared/Layout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Clock, MapPin, Settings as SettingsIcon, Save } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export const AdminSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminService.getSettings();
      setValue('late_punch_time', data.late_punch_time);
      setValue('mandatory_working_hours', data.mandatory_working_hours);
      setValue('office_lat', data.office_location.lat);
      setValue('office_lng', data.office_location.lng);
      setValue('failed_attempt_alert_threshold', data.failed_attempt_alert_threshold);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const settings = {
        late_punch_time: data.late_punch_time,
        mandatory_working_hours: Number(data.mandatory_working_hours),
        office_location: {
          lat: Number(data.office_lat),
          lng: Number(data.office_lng)
        },
        failed_attempt_alert_threshold: Number(data.failed_attempt_alert_threshold)
      };
      
      await adminService.updateSettings(settings);
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="System Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        </div>

        {/* Settings Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Attendance Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Attendance Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Late Punch-In Time
                  </label>
                  <input
                    type="time"
                    {...register('late_punch_time', { required: 'Late punch-in time is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.late_punch_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.late_punch_time.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mandatory Working Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    {...register('mandatory_working_hours', { required: 'Mandatory working hours is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.mandatory_working_hours && (
                    <p className="mt-1 text-sm text-red-600">{errors.mandatory_working_hours.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Office Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('office_lat', { required: 'Office latitude is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 28.7041"
                  />
                  {errors.office_lat && (
                    <p className="mt-1 text-sm text-red-600">{errors.office_lat.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('office_lng', { required: 'Office longitude is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 77.1025"
                  />
                  {errors.office_lng && (
                    <p className="mt-1 text-sm text-red-600">{errors.office_lng.message}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                GPS coordinates for the office location. Employees must be within this location to mark attendance.
              </p>
            </div>

            {/* Alert Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alert Settings
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Failed Attempt Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  {...register('failed_attempt_alert_threshold', { required: 'Failed attempt threshold is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.failed_attempt_alert_threshold && (
                  <p className="mt-1 text-sm text-red-600">{errors.failed_attempt_alert_threshold.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Number of failed ML validation attempts before alerting admin.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                icon={Save}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};