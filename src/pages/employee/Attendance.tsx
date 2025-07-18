import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/shared/Layout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { format } from 'date-fns';

export const EmployeeAttendance: React.FC = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceHistory();
    fetchStats();
  }, [period]);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getAttendanceHistory({ period, page: 1 });
      setAttendanceHistory(data.records);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await attendanceService.getAttendanceStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      overtime: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout title="Attendance History">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.present_days || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.late_days || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.overtime_hours || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.attendance_rate || 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
              <div className="flex space-x-2">
                <Button
                  variant={period === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('week')}
                >
                  Week
                </Button>
                <Button
                  variant={period === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('month')}
                >
                  Month
                </Button>
                <Button
                  variant={period === 'year' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('year')}
                >
                  Year
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punch In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punch Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Working Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceHistory.map((record: any) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.punch_in ? new Date(record.punch_in.time + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12: true,}): '--:--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.punch_out ? new Date(record.punch_out.time + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12: true,}): '--:--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.working_hours || 0} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};