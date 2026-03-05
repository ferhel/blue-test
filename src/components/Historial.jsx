import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

function getIpvColor(ipv) {
  return ipv >= 80 ? estilos.verde : ipv >= 50 ? estilos.amarillo : estilos.rojo;
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Mini gráfica de barras SVG ───
function GraficaIPV({ sesiones }) {
  if (sesiones.length === 0) return null;

  const datos = [...sesiones].reverse().slice(-10); // últimas 10, en orden cronológico
  const W = 480;
  const H = 120;
  const padL = 32;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const anchoUtil = W - padL - padR;
  const altoUtil = H - padT - padB;
  const anchoBarra = Math.min(36, (anchoUtil / datos.length) - 6);

  return (
    <div style={{
      background: estilos.bgCard, border: `1px solid ${estilos.border}`,
      borderRadius: 14, padding: "18px 20px", marginBottom: 20,
    }}>
      <p style={{ color: estilos.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, margin: "0 0 16px" }}>
        📈 TENDENCIA DE PRESENCIA (IPV)
      </p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Líneas guía */}
        {[0, 50, 80, 100].map((v) => {
          const y = padT + altoUtil - (v / 100) * altoUtil;
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke={estilos.border} strokeWidth="1" strokeDasharray="4,4" />
              <text x={padL - 6} y={y + 4} textAnchor="end"
                fill={estilos.textMuted} fontSize="10">{v}%</text>
            </g>
          );
        })}

        {/* Barras */}
        {datos.map((s, i) => {
          const x = padL + (i / datos.length) * anchoUtil + (anchoUtil / datos.length - anchoBarra) / 2;
          const h = (s.ipvGlobal / 100) * altoUtil;
          const y = padT + altoUtil - h;
          const color = getIpvColor(s.ipvGlobal);
          return (
            <g key={i}>
              <rect x={x} y={y} width={anchoBarra} height={h}
                rx="4" fill={color} opacity="0.85" />
              <text x={x + anchoBarra / 2} y={H - padB + 14}
                textAnchor="middle" fill={estilos.textMuted} fontSize="9">
                {formatFecha(s.fecha).split(" ")[0]}
              </text>
              <text x={x + anchoBarra / 2} y={y - 4}
                textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
                {s.ipvGlobal}%
              </text>
            </g>
          );
        })}

        {/* Línea de tendencia */}
        {datos.length > 1 && (() => {
          const puntos = datos.map((s, i) => {
            const x = padL + (i / datos.length) * anchoUtil + (anchoUtil / datos.length) / 2;
            const y = padT + altoUtil - (s.ipvGlobal / 100) * altoUtil;
            return `${x},${y}`;
          });
          return (
            <polyline
              points={puntos.join(" ")}
              fill="none"
              stroke={estilos.accent}
              strokeWidth="2"
              strokeDasharray="5,3"
              opacity="0.6"
            />
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Tarjeta de sesión ───
function TarjetaSesion({ sesion, onEliminar }) {
  const [expandida, setExpandida] = useState(false);

  return (
    <div style={{
      background: estilos.bgCard, border: `1px solid ${estilos.border}`,
      borderRadius: 14, padding: "16px 18px", marginBottom: 12,
      transition: "border-color 0.15s",
    }}>
      <div
        onClick={() => setExpandida((p) => !p)}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* IPV badge */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: `${getIpvColor(sesion.ipvGlobal)}18`,
          border: `2px solid ${getIpvColor(sesion.ipvGlobal)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 13, color: getIpvColor(sesion.ipvGlobal),
        }}>
          {sesion.ipvGlobal}%
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: estilos.text, fontWeight: 700, fontSize: 14, margin: "0 0 3px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sesion.materia}
          </p>
          <p style={{ color: estilos.textMuted, fontSize: 12, margin: 0 }}>
            {formatFecha(sesion.fecha)} · {sesion.duracionMin} min · {sesion.pomodorosCompletados} 🍅
          </p>
        </div>

        <span style={{ color: estilos.textMuted, fontSize: 18 }}>
          {expandida ? "▲" : "▼"}
        </span>
      </div>

      {/* Detalle expandido */}
      {expandida && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${estilos.border}` }}>
          <p style={{ color: estilos.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: "0 0 6px" }}>
            OBJETIVO
          </p>
          <p style={{ color: estilos.text, fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
            {sesion.objetivo}
          </p>

          {sesion.historialPomodoros?.length > 0 && (
            <>
              <p style={{ color: estilos.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: "0 0 10px" }}>
                IPV POR POMODORO
              </p>
              {sesion.historialPomodoros.map((p, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: estilos.textMuted, fontSize: 12 }}>Pomodoro {p.numero}</span>
                    <span style={{ color: getIpvColor(p.ipv), fontWeight: 700, fontSize: 12 }}>{p.ipv}%</span>
                  </div>
                  <div style={{ height: 5, background: estilos.accentSoft, borderRadius: 5 }}>
                    <div style={{
                      height: "100%", width: `${p.ipv}%`,
                      background: getIpvColor(p.ipv), borderRadius: 5,
                    }} />
                  </div>
                </div>
              ))}
            </>
          )}

          <button onClick={(e) => { e.stopPropagation(); onEliminar(); }} style={{
            marginTop: 12, padding: "6px 14px", borderRadius: 8,
            background: "transparent", border: `1px solid #3D1A1A`,
            color: estilos.rojo, fontSize: 12, cursor: "pointer",
          }}>
            🗑 Eliminar sesión
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL HISTORIAL ───
export default function Historial() {
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("blue_historial") || "[]");
      setSesiones(data);
    } catch {
      setSesiones([]);
    }
  }, []);

  function eliminar(idx) {
    const nuevas = sesiones.filter((_, i) => i !== idx);
    setSesiones(nuevas);
    localStorage.setItem("blue_historial", JSON.stringify(nuevas));
  }

  function limpiarTodo() {
    if (window.confirm("¿Eliminar todo el historial?")) {
      setSesiones([]);
      localStorage.removeItem("blue_historial");
    }
  }

  // Stats globales
  const totalSesiones = sesiones.length;
  const ipvPromedio = totalSesiones > 0
    ? Math.round(sesiones.reduce((acc, s) => acc + s.ipvGlobal, 0) / totalSesiones)
    : 0;
  const totalMinutos = sesiones.reduce((acc, s) => acc + (s.duracionMin || 0), 0);
  const totalPomodoros = sesiones.reduce((acc, s) => acc + (s.pomodorosCompletados || 0), 0);

  return (
    <div style={{
      minHeight: "100vh", background: estilos.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "32px 16px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 560,
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
          <span style={{ color: estilos.textMuted, fontSize: 12 }}>/ Historial</span>
        </div>
        <button onClick={() => navigate("/")} style={{
          background: "transparent", border: `1px solid ${estilos.border}`,
          color: estilos.textMuted, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer",
        }}>← Inicio</button>
      </div>

      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Stats globales */}
        {totalSesiones > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Sesiones", valor: totalSesiones, color: estilos.accent },
              { label: "IPV prom.", valor: `${ipvPromedio}%`, color: getIpvColor(ipvPromedio) },
              { label: "Minutos", valor: totalMinutos, color: estilos.verde },
              { label: "Pomodoros", valor: totalPomodoros, color: estilos.amarillo },
            ].map(({ label, valor, color }) => (
              <div key={label} style={{
                background: estilos.bgCard, border: `1px solid ${estilos.border}`,
                borderRadius: 12, padding: "12px 8px", textAlign: "center",
              }}>
                <div style={{ color, fontWeight: 800, fontSize: 20, marginBottom: 3 }}>{valor}</div>
                <div style={{ color: estilos.textMuted, fontSize: 10 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Gráfica */}
        {sesiones.length > 1 && <GraficaIPV sesiones={sesiones} />}

        {/* Lista sesiones */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ color: estilos.text, fontSize: 15, fontWeight: 700, margin: 0 }}>
            Sesiones ({totalSesiones})
          </h3>
          {totalSesiones > 0 && (
            <button onClick={limpiarTodo} style={{
              background: "transparent", border: "none",
              color: estilos.rojo, fontSize: 12, cursor: "pointer", opacity: 0.7,
            }}>
              Limpiar todo
            </button>
          )}
        </div>

        {sesiones.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: estilos.bgCard, border: `1px solid ${estilos.border}`,
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <p style={{ color: estilos.textMuted, fontSize: 15, margin: "0 0 20px" }}>
              Aún no hay sesiones registradas.
            </p>
            <button onClick={() => navigate("/sala")} style={{
              padding: "10px 24px", borderRadius: 10,
              background: "linear-gradient(135deg, #34D399, #059669)",
              color: "#fff", fontWeight: 700, fontSize: 14,
              border: "none", cursor: "pointer",
            }}>
              Ir a la sala de estudio →
            </button>
          </div>
        ) : (
          sesiones.map((s, i) => (
            <TarjetaSesion key={i} sesion={s} onEliminar={() => eliminar(i)} />
          ))
        )}
      </div>
    </div>
  );
}
