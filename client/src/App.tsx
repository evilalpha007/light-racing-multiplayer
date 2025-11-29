
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ForgotPassword } from './components/Auth/ForgotPassword';
import { ResetPassword } from './components/Auth/ResetPassword';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Lobby } from './components/Lobby/Lobby';
import { WaitingRoom } from './components/Lobby/WaitingRoom';
import { MultiplayerGame } from './components/Game/MultiplayerGame';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <Lobby />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <WaitingRoom />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/game/:roomId"
            element={
              <ProtectedRoute>
                <MultiplayerGame />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
