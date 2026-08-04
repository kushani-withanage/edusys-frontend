import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { GlobalAlertContainer } from './components/common/GlobalAlertContainer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalAlertContainer />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
