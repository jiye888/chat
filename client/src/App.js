import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {AuthProvider} from './auth/AuthProvider';
import {SocketProvider} from './context/SocketContext';
import MainApp from './MainApp';
import Interceptor from './Interceptor';

function App() {
  
  return (
    
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Interceptor>
            <MainApp/>
          </Interceptor>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
