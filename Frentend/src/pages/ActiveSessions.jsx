import React, { useState, useEffect } from 'react';
import {
  getActiveSessions,
  logoutUserFromDevice,
  logoutFromAllDevices,
} from '@/services/userApi.js';

const ActiveSessions = () => {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(null);

  const userId = JSON.parse(localStorage.getItem('user'))?._id;
  const currentDeviceId = localStorage.getItem('currentDeviceId');

  // Fetch active sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      const response = await getActiveSessions(userId);

      if (!response?.data) {
        throw new Error('Failed to fetch sessions');
      }

      setSessions(response.data);
    } catch (err) {
      console.error('Fetch sessions error:', err);
      setError(err.message || 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutDevice = async (deviceId) => {
    try {
      setLogoutLoading(deviceId);
      setError('');

      const response = await logoutUserFromDevice(deviceId, userId);

      if (!response?.data) {
        throw new Error('Logout failed');
      }

      // Update sessions
      setSessions({
        ...response.data,
        devices: response.data.activeDevices || [],
      });

      // If logged out from all devices, redirect to login
      if (!response.data.isLoggedIn) {
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('currentDeviceId');
          window.location.href = '/login';
        }, 1500);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout from device');
    } finally {
      setLogoutLoading(null);
    }
  };

  const handleLogoutAll = async () => {
    if (
      !window.confirm(
        'Are you sure? This will logout from all devices and you will need to login again.'
      )
    ) {
      return;
    }

    try {
      setLogoutLoading('all');
      setError('');

      const response = await logoutFromAllDevices(userId);

      if (!response?.data?.isLoggedIn === false) {
        throw new Error('Failed to logout from all devices');
      }

      // Redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentDeviceId');

      window.location.href = '/login';
    } catch (err) {
      console.error('Logout all error:', err);
      setError(err.message || 'Failed to logout from all devices');
    } finally {
      setLogoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="sessions-container">
        <div className="loading">Loading your active sessions...</div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="sessions-card">
        <h1>Active Sessions</h1>
        <p className="subtitle">
          Devices and browsers where you're currently logged in
        </p>

        {error && <div className="error-message">{error}</div>}

        {sessions?.isLoggedIn === false ? (
          <div className="no-sessions">
            <p>You are not currently logged in on any device.</p>
            <a href="/login" className="login-link">
              Go to login
            </a>
          </div>
        ) : sessions?.devices && sessions.devices.length > 0 ? (
          <>
            <div className="sessions-list">
              {sessions.devices.map((device) => {
                const isCurrentDevice = device.deviceId === currentDeviceId;
                const lastActive = new Date(device.lastActive);
                const now = new Date();
                const timeDiff = now - lastActive;
                const minutesAgo = Math.floor(timeDiff / 60000);
                const hoursAgo = Math.floor(timeDiff / 3600000);
                const daysAgo = Math.floor(timeDiff / 86400000);

                let timeString;
                if (minutesAgo < 1) timeString = 'Just now';
                else if (minutesAgo < 60)
                  timeString = `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
                else if (hoursAgo < 24)
                  timeString = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
                else
                  timeString = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;

                return (
                  <div
                    key={device.deviceId}
                    className={`session-item ${isCurrentDevice ? 'current' : ''}`}
                  >
                    <div className="session-info">
                      <div className="device-header">
                        <span className="device-icon">
                          {device.userAgent?.includes('Mobile')
                            ? '📱'
                            : '💻'}
                        </span>
                        <div className="device-details">
                          <h3>
                            Device {device.deviceId.slice(0, 8)}
                            {isCurrentDevice && (
                              <span className="current-badge">Current</span>
                            )}
                          </h3>
                          <p className="device-meta">
                            {device.ipAddress} • Last active: {timeString}
                          </p>
                          <p className="device-agent">
                            {device.userAgent?.slice(0, 80)}...
                          </p>
                          <p className="login-count">
                            Logged in {device.loginCount} time
                            {device.loginCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLogoutDevice(device.deviceId)}
                        disabled={logoutLoading === device.deviceId}
                        className={`logout-btn ${
                          logoutLoading === device.deviceId ? 'loading' : ''
                        }`}
                      >
                        {logoutLoading === device.deviceId
                          ? 'Logging out...'
                          : 'Logout'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleLogoutAll}
              disabled={logoutLoading === 'all'}
              className="logout-all-btn"
            >
              {logoutLoading === 'all'
                ? 'Logging out...'
                : 'Logout From All Devices'}
            </button>
          </>
        ) : (
          <div className="no-sessions">
            <p>No active sessions found.</p>
          </div>
        )}

        <div className="sessions-footer">
          <p>
            Don't recognize a device? You can logout from individual devices or
            logout from all devices and login again with your password.
          </p>
        </div>
      </div>

      <style>{`
        .sessions-container {
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .sessions-card {
          background: white;
          border-radius: 8px;
          padding: 30px;
          max-width: 700px;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .sessions-card h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
        }

        .subtitle {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #c33;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .no-sessions {
          text-align: center;
          padding: 40px;
          background: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }

        .login-link {
          display: inline-block;
          margin-top: 15px;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
        }

        .sessions-list {
          margin-bottom: 20px;
        }

        .session-item {
          background: #f9f9f9;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.3s;
        }

        .session-item:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .session-item.current {
          background: #f0f4ff;
          border-color: #667eea;
        }

        .session-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .device-header {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .device-icon {
          font-size: 24px;
          line-height: 1.5;
        }

        .device-details {
          flex: 1;
        }

        .device-details h3 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .current-badge {
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .device-meta {
          margin: 0 0 5px 0;
          color: #999;
          font-size: 12px;
        }

        .device-agent {
          margin: 0 0 5px 0;
          color: #999;
          font-size: 12px;
          word-break: break-word;
        }

        .login-count {
          margin: 0;
          color: #999;
          font-size: 12px;
        }

        .logout-btn {
          padding: 8px 16px;
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .logout-btn:hover:not(:disabled) {
          background: #ff6b6b;
          color: white;
          border-color: #ff6b6b;
        }

        .logout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .logout-btn.loading {
          opacity: 0.6;
        }

        .logout-all-btn {
          width: 100%;
          padding: 12px;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 20px;
          transition: opacity 0.3s;
        }

        .logout-all-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .logout-all-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sessions-footer {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid #ffc107;
        }

        .sessions-footer p {
          margin: 0;
          color: #666;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .sessions-card {
            padding: 15px;
          }

          .session-info {
            flex-direction: column;
          }

          .logout-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ActiveSessions;
