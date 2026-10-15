import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

const SIN_CONFIGURAR = { data: null, error: new Error("Supabase no está configurado (falta el archivo .env).") };
const sinConfigurar = () => Promise.resolve(SIN_CONFIGURAR);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Mientras Supabase revisa si ya había una sesión guardada, no sabemos si hay usuario
  const [cargando, setCargando] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    // 1) Sesión que ya estaba guardada en el navegador (si la hay)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    // 2) Cambios futuros: login, logout, token renovado, etc.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSession) => {
      setSession(nuevaSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const valor = useMemo(() => {
    const auth = supabase ? supabase.auth : null;
    return {
      session,
      user: session?.user ?? null,
      cargando,
      registrarse: auth
        ? (email, password, nombre) => auth.signUp({ email, password, options: { data: { nombre } } })
        : sinConfigurar,
      iniciarSesion: auth ? (email, password) => auth.signInWithPassword({ email, password }) : sinConfigurar,
      cerrarSesion: auth ? () => auth.signOut() : sinConfigurar,
      recuperarPassword: auth
        ? (email) => auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/nueva-password" })
        : sinConfigurar,
      actualizarPassword: auth ? (password) => auth.updateUser({ password }) : sinConfigurar,
    };
  }, [session, cargando]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  return contexto;
}
