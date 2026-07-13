import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Collapse,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  PersonRounded,
  EmailRounded,
  LockRounded,
  Visibility,
  VisibilityOff,
  InventoryRounded
} from '@mui/icons-material';
import bgImage from '../../assets/outlet-bg.jpg';
import icon from '../../assets/login-icon.png';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f59e0b',
    },
    background: {
      default: 'transparent',
      paper: 'rgba(255, 255, 255, 0.08)',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Poppins', sans-serif",
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f59e0b',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 10px rgba(245, 158, 11, 0.3)',
            }
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#9ca3af',
          '&.Mui-focused': {
            color: '#f59e0b',
          }
        }
      }
    }
  },
});

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    setError('');

    try {
      const res = await registerUser(data);
      const token = res.data?.token || res.data?.data?.token || res.data?.accessToken || res.data?.data?.accessToken;
      const user = res.data?.user || res.data?.data?.user || { username: data.username, email: data.email, role: 'USER' };
      if (token) {
        login(user, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 2,
        perspective: '1200px'
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -2
        }} />
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          zIndex: -1
        }} />

        <Container maxWidth="xs" sx={{ zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <img src={icon} alt="icon" style={{ width: 65, height: 65, filter: 'drop-shadow(0 0 8px rgba(219, 95, 13, 0.6))' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mt: 1, mb: 1, fontFamily: 'inherit' }}>
              InventoryPro
            </Typography>
            <Typography variant="body1" sx={{ color: '#d1d5db', fontFamily: 'inherit' }}>
              Create your new account.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.05)',
              animation: 'flipInYRegister 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
              backfaceVisibility: 'hidden'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: '#ffffff', fontFamily: 'inherit' }}>
              Sign Up
            </Typography>

            <Collapse in={!!error}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Collapse>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ position: 'relative', mb: 2.5 }}>
                <TextField
                  label="Username"
                  name="username"
                  type="text"
                  fullWidth
                  {...register("username", { required: "Username is required" })}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box sx={{ position: 'relative', mb: 2.5 }}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  fullWidth
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box sx={{ position: 'relative', mb: 3 }}>
                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  {...register("password", { 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  type="button"
                  sx={{ 
                    position: 'absolute', 
                    right: 8, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {isSubmitting ? 'Registering...' : 'Create Account'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Container>
        <style>{`
        @keyframes flipInYRegister {
            0% { opacity: 0; transform: perspective(1200px) rotateY(90deg); }
            100% { opacity: 1; transform: perspective(1200px) rotateY(0); }
        }
      `}</style>
      </Box>
    </ThemeProvider>
  );
};

export default Register;
