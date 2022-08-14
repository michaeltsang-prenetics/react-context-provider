import { useContext } from 'react';
import { AuthContext } from './provider/AuthProvider/context/AuthContext';

export const useAuth = () => useContext(AuthContext);
