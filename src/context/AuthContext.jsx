import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { reiniciarCache } from "../store/consultas.js";
import { crearClienteTemporal, supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

const SIN_CONFIGURAR = { data: null, error: new Error("Supabase no está configurado (falta el archivo .env).") };
const sinConfigurar = () => Promise.resolve(SIN_CONFIGURAR);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Mientras Supabase revisa si ya había una sesión guardada, no sabemos si hay usuario
  const [cargandoSesion, setCargandoSesion] = useState(Boolean(supabase));
  // Id del usuario actual: si cambia (otro login, logout), se vacían los datos cacheados de la cuenta anterior
  const usuarioId = useRef(null);

  // Perfil de la cuenta (rol y si está activa). Lo crea el administrador al dar de alta a la persona.
  const [perfil, setPerfil] = useState(null);
  const [estadoPerfil, setEstadoPerfil] = useState("listo"); // "cargando" | "listo" | "error"
  const [intentoPerfil, setIntentoPerfil] = useState(0);

  useEffect(() => {
    if (!supabase) return;

    // 1) Sesión que ya estaba guardada en el navegador (si la hay)
    supabase.auth.getSession().then(({ data }) => {
      usuarioId.current = data.session?.user?.id ?? null;
      setSession(data.session);
      setCargandoSesion(false);
    });

    // 2) Cambios futuros: login, logout, token renovado, etc.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSession) => {
      const id = nuevaSession?.user?.id ?? null;
      if (id !== usuarioId.current) {
        usuarioId.current = id;
        reiniciarCache(Boolean(id));
      }
      setSession(nuevaSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Cada vez que cambia la persona con sesión, se busca su perfil
  const idUsuario = session?.user?.id ?? null;
  useEffect(() => {
    if (!supabase || !idUsuario) {
      setPerfil(null);
      setEstadoPerfil("listo");
      return;
    }
    let cancelado = false;
    setEstadoPerfil("cargando");
    supabase
      .from("perfiles")
      .select("id,nombre,email,rol,activo")
      .eq("id", idUsuario)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return;
        setPerfil(error ? null : data);
        setEstadoPerfil(error ? "error" : "listo");
      });
    return () => {
      cancelado = true;
    };
  }, [idUsuario, intentoPerfil]);

  const reintentarPerfil = useCallback(() => setIntentoPerfil((n) => n + 1), []);

  const valor = useMemo(() => {
    const auth = supabase ? supabase.auth : null;
    const user = session?.user ?? null;
    return {
      session,
      user,
      // Mientras no se sepa si hay sesión y cuál es su perfil, no se decide a dónde ir
      cargando: cargandoSesion || (Boolean(user) && estadoPerfil === "cargando"),
      perfil,
      errorPerfil: estadoPerfil === "error",
      esAdmin: Boolean(perfil?.activo && perfil?.rol === "admin"),
      reintentarPerfil,
      iniciarSesion: auth ? (email, password) => auth.signInWithPassword({ email, password }) : sinConfigurar,
      cerrarSesion: auth ? () => auth.signOut() : sinConfigurar,
      // Cambia la contraseña de alguien que sabe la actual, sin dejarle la sesión abierta
      cambiarPasswordConActual: async (email, actual, nueva) => {
        const temporal = crearClienteTemporal();
        if (!temporal) return SIN_CONFIGURAR;
        const { error: errorLogin } = await temporal.auth.signInWithPassword({ email, password: actual });
        if (errorLogin) return { data: null, error: errorLogin };
        const resultado = await temporal.auth.updateUser({ password: nueva });
        await temporal.auth.signOut({ scope: "local" }); // la sesión temporal se descarta
        return resultado;
      },
      recuperarPassword: auth
        ? (email) => auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/nueva-password" })
        : sinConfigurar,
      actualizarPassword: auth ? (password) => auth.updateUser({ password }) : sinConfigurar,
    };
  }, [session, cargandoSesion, perfil, estadoPerfil, reintentarPerfil]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  return contexto;
}
