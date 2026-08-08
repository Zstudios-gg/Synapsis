import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      throw err;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, loading, loginWithGoogle, logout };
}
