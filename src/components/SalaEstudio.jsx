import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CamaraConcentracion from './CamaraConcentracion';

// ─── Constantes Pomodoro ───
const POMODORO_TRABAJO = 25 * 60;
const POMODORO_DESCANSO = 5 * 60;

const estilos = {
  bg: "#0A0E1A",
  bgCard: "#0F1628",
  accent: "#4F8EF7",
  accentSoft: "#1E3A6E",
  text: "#E8EEFF",
  textMuted: "#7A8BB5",
  border: "#1E2D54",
  verde: "#34D399",
  rojo: "#EF4444",
  amarillo: "#F59E0B",
};

function formatTiempo(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getIpvColor(ipv) {
  return ipv >= 80 ? estilos.verde : ipv >= 50 ? estilos.amarillo : estilos.rojo;
}

function guardarSesion(sesion) {
  try {
    const prev = JSON.parse(localStorage.getItem("blue_historial") || "[]");
    prev.unshift(sesion);
    localStorage.setItem("blue_historial", JSON.stringify(prev.slice(0, 50)));
  } catch (e) {
    console.error("Error guardando sesión:", e);
  }
}

// ─── PANTALLA 1: Configurar objetivo ───
function PantallaObjetivo({ onIniciar }) {
  const [materia, setMateria] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [pomodoros, setPomodoros] = useState(2);
  const listo = materia.trim() && objetivo.trim();

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
        <h2 style={{ color: estilos.text, fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
          ¿Qué vas a estudiar hoy?
        </h2>
        <p style={{ color: estilos.textMuted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Declarar un objetivo antes de estudiar activa tu metacognición desde el inicio.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ color: estilos.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: 1, display: "block", marginBottom: 8 }}>
          MATERIA O TEMA
        </label>
        <input
          value={materia}
          onChange={(e) => setMateria(e.target.value)}
          placeholder="Ej: Química Orgánica, Cálculo II..."
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10,
            background: estilos.bgCard, border: `1px solid ${estilos.border}`,
            color: estilos.text, fontSize: 15, outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ color: estilos.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: 1, display: "block", marginBottom: 8 }}>
          OBJETIVO DE LA SESIÓN
        </label>
        <textarea
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          placeholder="Ej: Entender los mecanismos de reacción SN1 y SN2 y resolver 5 ejercicios."
          rows={3}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10,
            background: estilos.bgCard, border: `1px solid ${estilos.border}`,
            color: estilos.text, fontSize: 14, outline: "none",
            resize: "none", lineHeight: 1.6, boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={{ color: estilos.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: 1, display: "block", marginBottom: 12 }}>
          NÚMERO DE POMODOROS (25 min c/u)
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} onClick={() => setPomodoros(n)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: `2px solid ${pomodoros === n ? estilos.accent : estilos.border}`,
              background: pomodoros === n ? estilos.accentSoft : "transparent",
              color: pomodoros === n ? estilos.accent : estilos.textMuted,
              fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.15s",
            }}>
              {n}
            </button>
          ))}
        </div>
        <p style={{ color: estilos.textMuted, fontSize: 12, marginTop: 8 }}>
          Tiempo total: {pomodoros * 25} min de trabajo + {pomodoros * 5} min de descanso
        </p>
      </div>

      <button
        onClick={() => listo && onIniciar({ materia, objetivo, pomodoros })}
        disabled={!listo}
        style={{
          width: "100%", padding: "14px", borderRadius: 12,
          background: listo ? "linear-gradient(135deg, #34D399, #059669)" : estilos.accentSoft,
          color: listo ? "#fff" : estilos.border,
          fontWeight: 700, fontSize: 16, border: "none",
          cursor: listo ? "pointer" : "default", transition: "all 0.2s",
        }}
      >
        Iniciar sesión →
      </button>
    </div>
  );
}

// ─── PANTALLA 2: Sala activa ───
function PantallaSala({ config, onFinalizar }) {
  const intervalTimer = useRef(null);
  const audioCtx = useRef(null);

  const [pomodoroActual, setPomodoroActual] = useState(1);
  const [fase, setFase] = useState("trabajo");
  const [tiempoRestante, setTiempoRestante] = useState(POMODORO_TRABAJO);
  const [pausado, setPausado] = useState(false);
  const [terminado, setTerminado] = useState(false);

  const historialPomodoros = useRef([]);
  const framesBloque = useRef({ total: 0, conCara: 0 });
  const pomodoroActualRef = useRef(1);
  const faseRef = useRef("trabajo");

  useEffect(() => { pomodoroActualRef.current = pomodoroActual; }, [pomodoroActual]);
  useEffect(() => { faseRef.current = fase; }, [fase]);

  function beep(freq = 440, dur = 300, tipo = "sine") {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.frequency.value = freq;
      osc.type = tipo;
      gain.gain.setValueAtTime(0.3, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur / 1000);
      osc.start();
      osc.stop(audioCtx.current.currentTime + dur / 1000);
    } catch (e) {}
  }

  // Timer Pomodoro
  useEffect(() => {
    if (pausado || terminado) return;
    intervalTimer.current = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          if (faseRef.current === "trabajo") {
            const ipvBloque = framesBloque.current.total > 0
              ? Math.round((framesBloque.current.conCara / framesBloque.current.total) * 100)
              : 0;
            historialPomodoros.current.push({ ipv: ipvBloque, numero: pomodoroActualRef.current });
            framesBloque.current = { total: 0, conCara: 0 };
            beep(660, 400);
            setTimeout(() => beep(880, 400), 450);
            if (pomodoroActualRef.current >= config.pomodoros) {
              setTerminado(true);
              clearInterval(intervalTimer.current);
              return 0;
            }
            setFase("descanso");
            return POMODORO_DESCANSO;
          } else {
            beep(440, 300);
            setPomodoroActual((p) => p + 1);
            setFase("trabajo");
            return POMODORO_TRABAJO;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalTimer.current);
  }, [pausado, terminado, fase]);

  useEffect(() => {
    if (!terminado) return;
    onFinalizar({
      materia: config.materia,
      objetivo: config.objetivo,
      pomodorosCompletados: config.pomodoros,
      ipvGlobal: 0,
      historialPomodoros: historialPomodoros.current,
      fecha: new Date().toISOString(),
      duracionMin: config.pomodoros * 30,
    });
  }, [terminado]);

  const progresoPom = fase === "trabajo"
    ? ((POMODORO_TRABAJO - tiempoRestante) / POMODORO_TRABAJO) * 100
    : ((POMODORO_DESCANSO - tiempoRestante) / POMODORO_DESCANSO) * 100;

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>

      {/* Cámara con detección de concentración */}
      <CamaraConcentracion activa={!pausado} />

      {/* Timer + Pomodoro */}
      <div style={{
        background: estilos.bgCard, border: `1px solid ${estilos.border}`,
        borderRadius: 20, padding: 20, marginBottom: 16,
      }}>

        {/* Badge de fase */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: fase === "trabajo" ? "#1A3A2A" : "#1A2A3A",
            border: `1px solid ${fase === "trabajo" ? estilos.verde : estilos.accent}`,
            borderRadius: 8, padding: "4px 14px", marginBottom: 12,
          }}>
            <span style={{
              color: fase === "trabajo" ? estilos.verde : estilos.accent,
              fontSize: 11, fontWeight: 700, letterSpacing: 1,
            }}>
              {fase === "trabajo" ? "🍅 TRABAJO" : "☕ DESCANSO"}
            </span>
          </div>

          {/* Timer */}
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: -2,
            color: fase === "trabajo" ? estilos.text : estilos.accent,
            fontVariantNumeric: "tabular-nums",
          }}>
            {formatTiempo(tiempoRestante)}
          </div>
          <div style={{ color: estilos.textMuted, fontSize: 13 }}>
            Pomodoro {pomodoroActual} de {config.pomodoros}
          </div>
        </div>

        {/* Barra progreso */}
        <div style={{ height: 6, background: estilos.accentSoft, borderRadius: 6, marginBottom: 16 }}>
          <div style={{
            height: "100%", width: `${progresoPom}%`,
            background: fase === "trabajo"
              ? "linear-gradient(90deg, #34D399, #059669)"
              : "linear-gradient(90deg, #4F8EF7, #7BB3FF)",
            borderRadius: 6, transition: "width 1s linear",
          }} />
        </div>

        {/* Círculos pomodoros */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          {Array.from({ length: config.pomodoros }).map((_, i) => {
            const completado = i < pomodoroActual - (fase === "descanso" ? 0 : 1);
            return (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: completado ? "#1A3A2A" : estilos.accentSoft,
                border: `2px solid ${completado ? estilos.verde : estilos.border}`,
                color: completado ? estilos.verde : estilos.textMuted,
              }}>
                {completado ? "✓" : i + 1}
              </div>
            );
          })}
        </div>

        {/* Botón pausar */}
        <button onClick={() => setPausado((p) => !p)} style={{
          width: "100%", padding: "12px", borderRadius: 10,
          background: pausado ? "linear-gradient(135deg, #4F8EF7, #7BB3FF)" : estilos.accentSoft,
          border: `1px solid ${estilos.border}`,
          color: pausado ? "#fff" : estilos.textMuted,
          fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {pausado ? "▶ Reanudar" : "⏸ Pausar"}
        </button>
      </div>

      {/* Objetivo */}
      <div style={{
        background: estilos.bgCard, border: `1px solid ${estilos.border}`,
        borderRadius: 14, padding: "16px 18px",
      }}>
        <p style={{ color: estilos.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: "0 0 6px" }}>
          🎯 TU OBJETIVO
        </p>
        <p style={{ color: estilos.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          {config.objetivo}
        </p>
      </div>
    </div>
  );
}

// ─── PANTALLA 3: Reporte final ───
function PantallaReporte({ reporte, onNuevaSesion }) {
  const navigate = useNavigate();
  const { materia, objetivo, pomodorosCompletados, ipvGlobal, historialPomodoros, duracionMin } = reporte;

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <h2 style={{ color: estilos.text, fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>
          Sesión completada
        </h2>
        <p style={{ color: estilos.textMuted, fontSize: 14, margin: 0 }}>{materia}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Duración", valor: `${duracionMin} min`, color: estilos.accent },
          { label: "Pomodoros", valor: pomodorosCompletados, color: estilos.verde },
        ].map(({ label, valor, color }) => (
          <div key={label} style={{
            background: estilos.bgCard, border: `1px solid ${estilos.border}`,
            borderRadius: 14, padding: "16px 10px", textAlign: "center",
          }}>
            <div style={{ color, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{valor}</div>
            <div style={{ color: estilos.textMuted, fontSize: 11 }}>{label}</div>
          </div>
        ))}
      </div>

      {historialPomodoros?.length > 0 && (
        <div style={{
          background: estilos.bgCard, border: `1px solid ${estilos.border}`,
          borderRadius: 14, padding: "18px 20px", marginBottom: 16,
        }}>
          <p style={{ color: estilos.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, margin: "0 0 14px" }}>
            🍅 POMODOROS COMPLETADOS
          </p>
          {historialPomodoros.map((p, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: estilos.text, fontSize: 13 }}>Pomodoro {p.numero}</span>
                <span style={{ color: estilos.verde, fontWeight: 700, fontSize: 13 }}>✓</span>
              </div>
              <div style={{ height: 5, background: estilos.accentSoft, borderRadius: 5 }}>
                <div style={{ height: "100%", width: "100%", background: estilos.verde, borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: estilos.bgCard, border: `1px solid ${estilos.border}`,
        borderRadius: 14, padding: "18px 20px", marginBottom: 16,
      }}>
        <p style={{ color: estilos.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, margin: "0 0 8px" }}>
          🎯 OBJETIVO DE LA SESIÓN
        </p>
        <p style={{ color: estilos.text, fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
          {objetivo}
        </p>
        <p style={{ color: estilos.textMuted, fontSize: 12, margin: "0 0 10px" }}>¿Lo cumpliste?</p>
        <div style={{ display: "flex", gap: 8 }}>
          {["✅ Sí", "⚡ Parcial", "❌ No"].map((op) => (
            <button key={op} onClick={() => {}} style={{
              flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12,
              background: "transparent", border: `1px solid ${estilos.border}`,
              color: estilos.textMuted, cursor: "pointer",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = estilos.accent; e.currentTarget.style.color = estilos.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = estilos.border; e.currentTarget.style.color = estilos.textMuted; }}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        borderRadius: 14, padding: "16px 20px", marginBottom: 24,
        background: "linear-gradient(135deg, #0D1F3C, #1A1040)",
        border: `1px solid ${estilos.border}`,
      }}>
        <p style={{ color: estilos.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: "0 0 8px" }}>
          💡 RETROALIMENTACIÓN
        </p>
        <p style={{ color: estilos.text, fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
          "Completaste tu sesión. Tómate un momento para reflexionar: ¿qué aprendiste realmente hoy?"
        </p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onNuevaSesion} style={{
          flex: 1, padding: "13px", borderRadius: 12,
          background: "linear-gradient(135deg, #34D399, #059669)",
          color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
        }}>
          Nueva sesión
        </button>
        <button onClick={() => navigate("/historial")} style={{
          flex: 1, padding: "13px", borderRadius: 12,
          background: estilos.bgCard, border: `1px solid ${estilos.border}`,
          color: estilos.text, fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          Ver historial →
        </button>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ───
export default function SalaEstudio() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("objetivo");
  const [config, setConfig] = useState(null);
  const [reporte, setReporte] = useState(null);

  function handleFinalizar(rep) {
    guardarSesion(rep);
    setReporte(rep);
    setVista("reporte");
  }

  return (
    <div style={{
      minHeight: "100vh", background: estilos.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "32px 16px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 520,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 32,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #4F8EF7, #7BB3FF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: "#fff", fontSize: 16,
          }}>B</div>
          <span style={{ color: estilos.text, fontWeight: 700, fontSize: 18 }}>Blue</span>
          <span style={{ color: estilos.textMuted, fontSize: 12 }}>/ Sala de Estudio</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/historial")} style={{
            background: "transparent", border: `1px solid ${estilos.border}`,
            color: estilos.textMuted, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer",
          }}>📊 Historial</button>
          <button onClick={() => navigate("/")} style={{
            background: "transparent", border: `1px solid ${estilos.border}`,
            color: estilos.textMuted, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer",
          }}>← Inicio</button>
        </div>
      </div>

      {vista === "objetivo" && <PantallaObjetivo onIniciar={(cfg) => { setConfig(cfg); setVista("sala"); }} />}
      {vista === "sala" && config && <PantallaSala config={config} onFinalizar={handleFinalizar} />}
      {vista === "reporte" && reporte && <PantallaReporte reporte={reporte} onNuevaSesion={() => { setConfig(null); setReporte(null); setVista("objetivo"); }} />}
    </div>
  );
}
