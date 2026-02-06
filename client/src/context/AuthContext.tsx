import React, { createContext, useContext, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../services/firebase";

interface AuthContextType {
    user:User | null;
    loading:boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider= ({children}:{children:React.ReactNode})=>{
    const [user,setUser]=React.useState<User | null>(null);
    const [loading,setLoading]=React.useState(true);

    useEffect(() => {
    // Ascolta i cambiamenti di stato di Firebase (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


export const useAuth=()=>{
    const context=useContext(AuthContext);
    if(context===undefined){
        throw new Error("useAuth deve essere usato all'interno di AuthProvider");
    }
    return context;
}