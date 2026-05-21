import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: any;
  poste: any;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [poste, setPoste] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedPoste = localStorage.getItem('poste');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPoste) setPoste(JSON.parse(savedPoste));
  }, []);

  const login = async (credentials: any) => {
    // Mock login logic based on user request
    console.log('Logging in with:', credentials);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockUser = { id: '1', pseudo: credentials.pseudo, nom_complet: 'Agent Douane' };
        const mockPoste = { id: '1', nom_poste: 'Douala Port', code_poste: credentials.code_poste };
        setUser(mockUser);
        setPoste(mockPoste);
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('poste', JSON.stringify(mockPoste));
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    setPoste(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('poste');
    localStorage.removeItem('selectedPosteCode');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
