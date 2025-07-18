import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/shared/Layout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminLeaves: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests();
  }, [filter]);

  const fetchLeaveRequests = async () => {
    try {
      const data = await leaveService.getLeaveRequests({ status: filter });
      setLeaveRequests(data);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await leaveService.approveLeave(leaveId);
      toast.success('Leave request approved successfully!');
      fetchLeaveRequests();
    } catch (error) {
      toast.error('Failed to approve leave request.');
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await leaveService.rejectLeave(leaveId);
      toast.success('Leave request rejected successfully!');
      fetchLeaveRequests();
    } catch (error) {
      toast.error('Failed to reject leave request.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <Layout title="Leave Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Leave Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <div className="flex space-x-2">
            <Button
              variant={filter === 'pending' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'approved' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              Approved
            </Button>
            <Button
              variant={filter === 'rejected' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </Button>
          </div>
        </div>

        {/* Leave Requests */}
        <Card>
          <div className="p-6">
            <div className="space-y-4">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No {filter} leave requests found.</p>
                </div>
              ) : (
                leaveRequests.map((leave: any) => (
                  <div key={leave._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            {leave.user?.photo_url ? (
                              <img 
                                src={leave.user.photo_url} 
                                alt={leave.user.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{leave.user?.name}</p>
                              <p className="text-xs text-gray-500">{leave.user?.department?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(leave.status)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-900 font-medium mb-1">
                            {format(new Date(leave.from_date), 'MMM dd, yyyy')} - {format(new Date(leave.to_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">{leave.reason}</p>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          Requested on {format(new Date(leave.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="success"
                            icon={CheckCircle}
                            onClick={() => handleApprove(leave._id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => handleReject(leave._id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};