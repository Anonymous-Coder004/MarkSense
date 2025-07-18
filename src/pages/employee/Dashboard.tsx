import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/shared/Layout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Clock, MapPin, Calendar, Bell, CheckCircle, XCircle } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const EmployeeDashboard: React.FC = () => {
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTodayAttendance();
    getCurrentLocation();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const data = await attendanceService.getTodayAttendance();
      setTodayAttendance(data);
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          toast.error('Location access denied. Please enable location services.');
        }
      );
    }
  };

  const handleMarkAttendance = async () => {
    if (!currentLocation) {
      toast.error('Please enable location services to mark attendance.');
      return;
    }

    setIsLoading(true);
    try {
      await attendanceService.markAttendance(currentLocation);
      toast.success('Attendance marked successfully!');
      fetchTodayAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!currentLocation) {
      toast.error('Please enable location services to punch out.');
      return;
    }

    setIsLoading(true);
    try {
      await attendanceService.punchOut(currentLocation);
      toast.success('Punched out successfully!');
      fetchTodayAttendance();
    } catch (error) {
      toast.error('Failed to punch out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStatus = () => {
    if (!todayAttendance) return 'Not Marked';
    if (todayAttendance.punch_out) return 'Completed';
    if (todayAttendance.punch_in) return 'Punched In';
    return 'Not Marked';
  };

  const getStatusColor = () => {
    const status = getAttendanceStatus();
    switch (status) {
      case 'Completed': return 'text-green-600';
      case 'Punched In': return 'text-blue-600';
      case 'Not Marked': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout title="Employee Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
              <p className="text-gray-600 mt-1">
                Today is {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Attendance Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
                <p className={`text-sm ${getStatusColor()}`}>
                  Status: {getAttendanceStatus()}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!todayAttendance?.punch_in ? (
                <Button 
                  onClick={handleMarkAttendance}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Marking...' : 'Mark Attendance'}
                </Button>
              ) : !todayAttendance?.punch_out ? (
                <Button 
                  onClick={handlePunchOut}
                  disabled={isLoading}
                  variant="danger"
                >
                  {isLoading ? 'Punching Out...' : 'Punch Out'}
                </Button>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Day Completed</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Punch In</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayAttendance?.punch_in ? 
                    new Date(todayAttendance.punch_in.time + 'Z').toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    }) : '--:--'
                  }
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Punch Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayAttendance?.punch_out ? 
                    new Date(todayAttendance.punch_out.time+ 'Z').toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    }) : '--:--'
                  }
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Working Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayAttendance?.working_hours || '0'} hrs
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Welcome to the system!</p>
                <p className="text-sm text-gray-600">Your account has been set up successfully.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};