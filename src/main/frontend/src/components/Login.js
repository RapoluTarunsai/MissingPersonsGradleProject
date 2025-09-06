import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/login.module.css';
import {toast, ToastContainer} from "react-toastify";

function Login({ setIsAuthenticated }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [forgotPassword, setForgotPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email })
      });

      if (response.ok) {
        setCodeSent(true);
        toast.success('Verification code sent to your email', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else {
        toast.error('Failed to send verification code', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      }
    } catch (error) {
      toast.error('Error sending verification code', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          verificationCode,
          newPassword
        })
      });

      if (response.ok) {
        setForgotPassword(false);
        toast.success('Password reset successful! Please login.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error('Failed to reset password. Please try again.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
      }
    } catch (error) {
      toast.error('Error resetting password. Please try again later.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('userEmail', credentials.email);
        const sessionValue = Date.now().toString();
        sessionStorage.setItem('token', sessionValue);
        localStorage.setItem('token', sessionValue);
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        toast.success(`Welcome back, ${credentials.email}! 👋`, {
          position: "top-center",
          autoClose: 2000
        });
        const redirectUrl = localStorage.getItem('redirectUrl');
        setTimeout(() => {
          if (redirectUrl) {
            localStorage.removeItem('redirectUrl');
            navigate(redirectUrl);
          } else {
            navigate('/missing-persons');
          }
        }, 2000);
      } else {
        // Handle the new error scenario
        if (response.status === 409) {
          toast.error(data.message || 'User is already logged in on another device. Please logout first.', {
            position: "top-center",
            autoClose: 5000
          });
        } else {
          toast.error('Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      toast.error('An error occurred during login. Please try again.');
    }
  };

  return (
      <div className={styles.container}>
        <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
        />
        <h2 className={styles.title}>Login</h2>

        {!forgotPassword ? (
            <>
              <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    className={styles.input}
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    required
                />
                  <input
                      className={styles.input}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                      required
                  />
                  <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                <button className={styles.button} type="submit">Login</button>
              </form>
              <button
                  className={styles.forgotButton}
                  onClick={() => setForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </>
        ) : (
            <div className={styles.form}>
              <input
                  className={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
              />
              {!codeSent ? (
                  <button
                      className={styles.button}
                      onClick={handleForgotPassword}
                  >
                    Send Verification Code
                  </button>
              ) : (
                  <>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="Enter verification code"
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                    />
                    <input
                        className={styles.input}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                    <button
                        className={styles.button}
                        onClick={handleResetPassword}
                    >
                      Reset Password
                    </button>
                  </>
              )}
              <button
                  className={styles.backButton}
                  onClick={() => {
                    setForgotPassword(false);
                    setCodeSent(false);
                  }}
              >
                Back to Login
              </button>
            </div>
        )}
      </div>
  );
}

export default Login;
