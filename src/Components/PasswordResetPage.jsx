import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CSS/PasswordReset.css';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const APi_Url = import.meta.env.VITE_API_URL;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${APi_Url}/digicoder/crm/api/v1/admin/forget-password/request`, { email });
      if (response.data.success) {
        toast.success('OTP sent successfully.');
        setStep(2);
      } else {
        toast.error(response.data.message || 'Failed to send OTP.');
      }
    } catch {
      toast.error('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${APi_Url}/digicoder/crm/api/v1/admin/forget-password/verify`, { email, otp });
      if (response.data.success) {
        toast.success('OTP verified successfully.');
        setStep(3);
      } else {
        toast.error(response.data.message || 'Invalid OTP.');
      }
    } catch {
      toast.error('Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${APi_Url}/digicoder/crm/api/v1/admin/forget-password/reset`, {
        email,
        otp,
        newPassword,
      });
      if (response.data.success) {
        toast.success('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(response.data.message || 'Failed to reset password.');
      }
    } catch {
      toast.error('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-container">
      <h2>Password Reset</h2>

      <ToastContainer position="top-right" autoClose={3000} />

      {step === 1 && (
        <form onSubmit={handleRequestOtp}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Request OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <label>OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying OTP...' : 'Verify OTP'}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PasswordResetPage;
