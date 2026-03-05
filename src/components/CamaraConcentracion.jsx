import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const INTERVALO_MS = 2000;
const MUESTRAS_PARA_CAMBIO = 3;
const COOLDOWN_MENSAJE_MS = 30000; // 30s entre mensajes del mismo tipo

// Umbrales más permisivos y realistas
const EAR_FATIGA = 0.17;           // muy bajo = casi cerrando ojos
const PITCH_LECTURA = 20;          // más inclinado = leyendo papel
const YAW_DISTRACCION = 25;        // más girado = mirando a otro lado
const CONF_EMOCION = 0.35;         // umbral mínimo para considerar una emoción

const ESTADOS = {
  cargando:    { emoji: "⏳", label: "Cargando...",      color: "#7A8BB5", bg: "#0F1628" },
  sinCara:     { emoji: "👤", label: "Sin presencia",    color: "#EF4444", bg: "#2D1010" },
  concentrado: { emoji: "🎯", label: "Concentrado",      color: "#34D399", bg: "#0D2A1A" },
  leyendo:     { emoji: "📖", label: "Leyendo",          color: "#60A5FA", bg: "#0D1A2E" },
  distraido:   { emoji: "💭", label: "Distraído",        color: "#F59E0B", bg: "#2A1E00" },
  frustrado:   { emoji: "😤", label: "Frustrado",        color: "#EF4444", bg: "#2D1010" },
  fatigado:    { emoji: "😴", label: "Fatigado",         color: "#A78BFA", bg: "#1A0F2E" },
  error:       { emoji: "⚠️", label: "Error de cámara", color: "#F59E0B", bg: "#2D1A00" },
};

const MENSAJES = {
  frustrado: [
    "Respira profundo. Cada problema difícil se rinde ante la persistencia. 🌊",
    "La frustración es señal de que estás creciendo. Tómate 30 segundos. ✨",
    "Está bien no entenderlo aún. Eso es exactamente por qué estás estudiando. 💙",
    "Pausa, bebe agua, vuelve. Tu cerebro sigue trabajando aunque descanses. 🧠",
  ],
  distraido: [
    "Oye, por aquí 👋 Vuelve a tu objetivo de esta sesión.",
    "Un pensamiento a la vez. ¿Qué ibas a estudiar ahora mismo?",
    "Es normal dispersarse. Lo importante es volver. Aquí estás. 🎯",
    "Pequeño recordatorio: puedes con esto. Vuelve al tema. 💪",
  ],
  fatigado: [
    "Tus ojos piden un descanso. Mira lejos 20 segundos. 👁️",
    "La fatiga es real. Un descanso corto ahora vale más que forzar. 🌿",
    "Considera tomar agua y estirar el cuello. Tu cuerpo también estudia. 💧",
  ],
  concentrado: [
    "¡Vas muy bien! Sigue así. 🔥",
    "Excelente concentración. Tu esfuerzo está dejando huella. ✨",
  ],
};

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

function calcularEAR(landmarks) {
  try {
    const pts = landmarks.positions;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const earOjo = (p) => (dist(p[1], p[5]) + dist(p[2], p[4])) / (2 * dist(p[0], p[3]));
    const izq = [pts[36], pts[37], pts[38], pts[39], pts[40], pts[41]];
    const der = [pts[42], pts[43], pts[44], pts[45], pts[46], pts[47]];
    return (earOjo(izq) + earOjo(der)) / 2;
  } catch {
    return null; // iluminación baja → ignorar silenciosamente
  }
}

function calcularAngulos(landmarks) {
  try {
    const pts = landmarks.positions;
    const nose = pts[30];
    const chin = pts[8];
    const leftEye = pts[36];
    const rightEye = pts[45];
    const eyeWidth = rightEye.x - leftEye.x;
    if (eyeWidth < 1) return null;
    const pitch = Math.atan2(chin.y - nose.y, chin.x - nose.x) * (180 / Math.PI) - 90;
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const yaw = ((nose.x - eyeMidX) / (eyeWidth / 2)) * 30;
    return { pitch, yaw };
  } catch {
    return null;
  }
}

function expresionDominante(expresiones) {
  if (!expresiones) return { nombre: "neutral", confianza: 0 };
  return Object.entries(expresiones)
    .map(([nombre, confianza]) => ({ nombre, confianza }))
    .reduce((a, b) => b.confianza > a.confianza ? b : a);
}

function mensajeAleatorio(tipo) {
  const lista = MENSAJES[tipo] || [];
  return lista[Math.floor(Math.random() * lista.length)] || "";
}

// ─────────────────────────────────────────────
// HOOK DE AUDIO
// ─────────────────────────────────────────────

function useAudio() {
  const ctxRef = useRef(null);

  const nota = useCallback((freq, dur, delay = 0) => {
    try {
      if (!ctxRef.current) ctxRef.current = new AudioContext();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    } catch {}
  }, []);

  return {
    paz:          () => { nota(261.6, 0.9, 0); nota(329.6, 0.9, 0.35); nota(392.0, 1.1, 0.7); },
    recordatorio: () => { nota(440, 0.5, 0); nota(392, 0.5, 0.45); },
    fatiga:       () => { nota(220, 1.3, 0); nota(196, 0.8, 0.5); },
    positivo:     () => { nota(523.2, 0.35, 0); nota(659.3, 0.35, 0.12); nota(783.9, 0.55, 0.25); },
  };
}

// ─────────────────────────────────────────────
// LÓGICA DE INFERENCIA DE ESTADO
// ─────────────────────────────────────────────

function inferirEstado(deteccion, landmarks, expresiones) {
  if (!deteccion) return "sinCara";

  const expr = expresionDominante(expresiones);
  const angulos = landmarks ? calcularAngulos(landmarks) : null;
  const ear = landmarks ? calcularEAR(landmarks) : null;

  // 1. FRUSTRACIÓN — angry o disgusted con confianza mínima
  // También si sad es muy dominante (puede indicar desmotivación/bloqueo)
  if (expr.confianza >= CONF_EMOCION) {
    if (expr.nombre === "angry" || expr.nombre === "disgusted") return "frustrado";
    if (expr.nombre === "sad" && expr.confianza > 0.5) return "frustrado";
  }

  // 2. DISTRACCIÓN por expresión — sorpresa o miedo = algo captó su atención
  if (
    (expr.nombre === "surprised" || expr.nombre === "fearful") &&
    expr.confianza > 0.45
  ) return "distraido";

  // 3. FATIGA — EAR muy bajo (solo si landmarks confiables, ignora en luz baja)
  if (ear !== null && ear < EAR_FATIGA) return "fatigado";

  // 4. POSICIÓN DE CABEZA (solo si hay angulos válidos)
  if (angulos) {
    // Leyendo papel o apuntes = cabeza inclinada hacia abajo
    if (angulos.pitch > PITCH_LECTURA) return "leyendo";
    // Mirando a otro lado = girado horizontalmente
    if (Math.abs(angulos.yaw) > YAW_DISTRACCION) return "distraido";
  }

  // 5. Por defecto = concentrado (neutral mirando a pantalla)
  return "concentrado";
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function CamaraConcentracion({ activa = true }) {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  const [camEstado, setCamEstado] = useState("cargando");
  const [estadoActual, setEstadoActual] = useState("cargando");
  const [mensaje, setMensaje] = useState(null);
  const [modelosCargados, setModelosCargados] = useState(false);

  const bufferEstados = useRef([]);
  const ultimoMensajePorTipo = useRef({});
  const contadores = useRef({
    concentrado: 0, leyendo: 0, distraido: 0,
    frustrado: 0, fatigado: 0, sinCara: 0,
  });
  const [stats, setStats] = useState({ ...contadores.current });

  const audio = useAudio();

  // ── Cargar los 3 modelos ──
  useEffect(() => {
    async function cargar() {
      try {
        const CDN = "https://justadudewhohacks.github.io/face-api.js/weights";
        await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(CDN),
        faceapi.nets.faceExpressionNet.loadFromUri(CDN),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(CDN),
]);
        setModelosCargados(true);
      } catch (e) {
        console.error("Error cargando modelos:", e);
        setCamEstado("error");
      }
    }
    cargar();
  }, []);

  // ── Encender cámara ──
  useEffect(() => {
    if (!modelosCargados) return;
    async function encender() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
        videoRef.current.srcObject = stream;
        setCamEstado("activa");
      } catch {
        setCamEstado("error");
      }
    }
    encender();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [modelosCargados]);

  // ── Emitir mensaje con cooldown ──
  const emitirMensaje = useCallback((tipo) => {
    const ahora = Date.now();
    if (ahora - (ultimoMensajePorTipo.current[tipo] || 0) < COOLDOWN_MENSAJE_MS) return;
    ultimoMensajePorTipo.current[tipo] = ahora;
    const texto = mensajeAleatorio(tipo);
    if (!texto) return;
    setMensaje({ tipo, texto });
    if (tipo === "frustrado") audio.paz();
    else if (tipo === "distraido") audio.recordatorio();
    else if (tipo === "fatigado") audio.fatiga();
    else if (tipo === "concentrado") audio.positivo();
    setTimeout(() => setMensaje(null), 7000);
  }, [audio]);

  // ── Loop de detección ──
  useEffect(() => {
    if (camEstado !== "activa" || !activa) return;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const resultado = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
          )
          .withFaceLandmarks(true)
          .withFaceExpressions();

        const estadoNuevo = inferirEstado(
          resultado || null,
          resultado?.landmarks || null,
          resultado?.expressions || null
        );

        // Suavizado — necesita 3 muestras consecutivas iguales
        bufferEstados.current.push(estadoNuevo);
        if (bufferEstados.current.length > MUESTRAS_PARA_CAMBIO) {
          bufferEstados.current.shift();
        }

        const confirmado =
          bufferEstados.current.length === MUESTRAS_PARA_CAMBIO &&
          bufferEstados.current.every((e) => e === estadoNuevo);

        if (confirmado) {
          setEstadoActual(estadoNuevo);
          contadores.current[estadoNuevo] = (contadores.current[estadoNuevo] || 0) + 1;
          setStats({ ...contadores.current });

          const c = contadores.current;
          if (estadoNuevo === "frustrado") emitirMensaje("frustrado");
          else if (estadoNuevo === "distraido") emitirMensaje("distraido");
          else if (estadoNuevo === "fatigado") emitirMensaje("fatigado");
          // Refuerzo positivo cada ~20s de concentración sostenida
          else if (estadoNuevo === "concentrado" && c.concentrado > 0 && c.concentrado % 10 === 0) {
            emitirMensaje("concentrado");
          }
        }
      } catch (e) {
        console.warn("Frame descartado:", e?.message);
      }
    }, INTERVALO_MS);

    return () => clearInterval(intervalRef.current);
  }, [camEstado, activa, emitirMensaje]);

  // ── Render ──
  const info = ESTADOS[estadoActual] || ESTADOS.cargando;
  const totalFrames = Object.values(contadores.current).reduce((a, b) => a + b, 0);
  const framesConCara = totalFrames - (contadores.current.sinCara || 0);
  const ipv = totalFrames > 0 ? Math.round((framesConCara / totalFrames) * 100) : 0;

  return (
    <div style={{
      background: "#0F1628",
      border: "1px solid #1E2D54",
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Mensaje motivador */}
      {mensaje && (
        <div style={{
          marginBottom: 16, padding: "14px 18px", borderRadius: 14,
          background:
            mensaje.tipo === "frustrado" ? "#0D2A1A" :
            mensaje.tipo === "fatigado"  ? "#1A0F2E" :
            mensaje.tipo === "concentrado" ? "#0D2A1A" : "#2A1E00",
          border: `1px solid ${
            mensaje.tipo === "frustrado" ? "#34D399" :
            mensaje.tipo === "fatigado"  ? "#A78BFA" :
            mensaje.tipo === "concentrado" ? "#34D399" : "#F59E0B"
          }`,
          display: "flex", alignItems: "flex-start", gap: 12,
          animation: "slideIn 0.3s ease",
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>
            {mensaje.tipo === "frustrado" ? "🌊" :
             mensaje.tipo === "fatigado"  ? "🌿" :
             mensaje.tipo === "concentrado" ? "🔥" : "🎯"}
          </span>
          <p style={{ color: "#E8EEFF", fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: "italic", flex: 1 }}>
            {mensaje.texto}
          </p>
          <button onClick={() => setMensaje(null)} style={{
            background: "none", border: "none", color: "#7A8BB5",
            fontSize: 16, cursor: "pointer", flexShrink: 0, padding: 0,
          }}>✕</button>
        </div>
      )}

      {/* Video */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{
            width: "100%", borderRadius: 12,
            objectFit: "cover", background: "#060910",
            minHeight: 180, display: "block",
          }}
        />

        {/* Badge estado actual */}
        <div style={{
          position: "absolute", bottom: 10, left: 10,
          display: "flex", alignItems: "center", gap: 8,
          background: info.bg,
          border: `1px solid ${info.color}50`,
          borderRadius: 10, padding: "6px 12px",
          backdropFilter: "blur(6px)",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: info.color,
            boxShadow: `0 0 8px ${info.color}`,
          }} />
          <span style={{ color: info.color, fontSize: 12, fontWeight: 700 }}>
            {info.emoji} {info.label}
          </span>
        </div>

        {/* IPV badge */}
        {totalFrames > 0 && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(0,0,0,0.65)",
            borderRadius: 10, padding: "6px 12px",
          }}>
            <span style={{ color: "#E8EEFF", fontSize: 12, fontWeight: 700 }}>
              IPV {ipv}%
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {camEstado === "error" && (
        <div style={{
          background: "#2D1A00", border: "1px solid #F59E0B",
          borderRadius: 10, padding: "12px 16px",
          color: "#FCD34D", fontSize: 13, lineHeight: 1.6,
        }}>
          ⚠️ No se pudo acceder a la cámara o cargar los modelos.
          Verifica que los archivos están en <code>public/models/</code>.
        </div>
      )}

      {/* Cargando */}
      {camEstado === "cargando" && (
        <p style={{ color: "#7A8BB5", fontSize: 13, textAlign: "center", margin: "8px 0" }}>
          ⏳ Cargando modelos de análisis facial...
        </p>
      )}

      {/* Stats de sesión */}
      {totalFrames > 3 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8, marginTop: 14,
        }}>
          {[
            { key: "concentrado", emoji: "🎯", label: "Concentrado" },
            { key: "leyendo",     emoji: "📖", label: "Leyendo" },
            { key: "distraido",   emoji: "💭", label: "Distraído" },
            { key: "frustrado",   emoji: "😤", label: "Frustrado" },
            { key: "fatigado",    emoji: "😴", label: "Fatigado" },
            { key: "sinCara",     emoji: "👤", label: "Ausente" },
          ].map(({ key, emoji, label }) => {
            const val = stats[key] || 0;
            const pct = totalFrames > 0 ? Math.round((val / totalFrames) * 100) : 0;
            const esDominante = estadoActual === key;
            return (
              <div key={key} style={{
                background: esDominante ? "#0D1F3C" : "#0A0E1A",
                borderRadius: 10, padding: "10px 8px", textAlign: "center",
                border: `1px solid ${esDominante ? "#4F8EF7" : "#1E2D54"}`,
                transition: "all 0.3s",
              }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{emoji}</div>
                <div style={{ color: esDominante ? "#4F8EF7" : "#E8EEFF", fontWeight: 700, fontSize: 14 }}>
                  {pct}%
                </div>
                <div style={{ color: "#7A8BB5", fontSize: 10 }}>{label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
