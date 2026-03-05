import { useState, useEffect, useRef } from "react";
import CamaraConcentracion from './CamaraConcentracion';
// ─────────────────────────────────────────────
// DATOS DEL TEST
// ─────────────────────────────────────────────

const DIMENSIONES = {
  E: "Estructural",
  R: "Reactiva",
  A: "Aplicada",
  St: "Estratégica",
  M: "Metacognitiva",
};

const PREGUNTAS_RAW = [
  // ESTRUCTURAL
  { id: "E1", dim: "E", texto: "Antes de estudiar un tema nuevo, dedico tiempo a identificar su estructura general.", invertido: false },
  { id: "E2", dim: "E", texto: "Elaboro esquemas o mapas conceptuales como parte habitual de mi estudio.", invertido: false },
  { id: "E3", dim: "E", texto: "Me resulta más fácil aprender cuando identifico las relaciones entre conceptos antes de memorizarlos.", invertido: false },
  { id: "E4", dim: "E", texto: "Planifico con anticipación qué estudiaré, cuánto tiempo y en qué orden.", invertido: false },
  { id: "E5", dim: "E", texto: "Suelo comenzar a estudiar sin organizar previamente el material.", invertido: true },
  { id: "E6", dim: "E", texto: "Cuando el tema es difícil, me bloqueo intentando estructurarlo y termino estudiando sin orden.", invertido: true },
  // REACTIVA
  { id: "R1", dim: "R", texto: "Cuando hay una fecha límite cercana, mi rendimiento aumenta notablemente.", invertido: false },
  { id: "R2", dim: "R", texto: "Me resulta más fácil mantener el foco cuando los objetivos son concretos e inmediatos.", invertido: false },
  { id: "R3", dim: "R", texto: "Sin presión externa, tiendo a postergar o estudiar con menos intensidad.", invertido: false },
  { id: "R4", dim: "R", texto: "Una entrega próxima me genera la motivación necesaria para concentrarme.", invertido: false },
  { id: "R5", dim: "R", texto: "Mantengo el mismo nivel de estudio independientemente de si hay una evaluación próxima.", invertido: true },
  { id: "R6", dim: "R", texto: "Puedo trabajar con plena concentración en un tema aunque no tenga ninguna urgencia externa.", invertido: true },
  // APLICADA
  { id: "A1", dim: "A", texto: "Aprendo mejor resolviendo ejercicios que leyendo explicaciones teóricas.", invertido: false },
  { id: "A2", dim: "A", texto: "Retengo la información con más facilidad cuando la aplico en situaciones reales o simuladas.", invertido: false },
  { id: "A3", dim: "A", texto: "Prefiero ver ejemplos concretos antes de estudiar la teoría formal de un concepto.", invertido: false },
  { id: "A4", dim: "A", texto: "Practicar activamente es imprescindible para que un tema me quede claro.", invertido: false },
  { id: "A5", dim: "A", texto: "Puedo comprender teoría compleja sin necesidad de aplicarla de inmediato.", invertido: true },
  { id: "A6", dim: "A", texto: "La teoría bien explicada me resulta suficiente para aprender, sin necesidad de ejemplos.", invertido: true },
  // ESTRATÉGICA
  { id: "St1", dim: "St", texto: "Necesito entender para qué sirve un tema antes de poder concentrarme en estudiarlo.", invertido: false },
  { id: "St2", dim: "St", texto: "Mi motivación aumenta cuando percibo que lo que estudio tendrá impacto en mi futuro.", invertido: false },
  { id: "St3", dim: "St", texto: "Integro información de varias fuentes para construir una comprensión global antes de profundizar.", invertido: false },
  { id: "St4", dim: "St", texto: "Organizo mentalmente el aprendizaje pensando en cómo lo usaré más adelante.", invertido: false },
  { id: "St5", dim: "St", texto: "Puedo estudiar con igual eficacia un tema aunque no le vea utilidad práctica ni futura.", invertido: true },
  { id: "St6", dim: "St", texto: "Me es indiferente conocer el propósito de un contenido para poder aprenderlo.", invertido: true },
  // METACOGNITIVA
  { id: "M1", dim: "M", texto: "Mientras estudio, me doy cuenta cuando dejo de entender algo y cambio de estrategia.", invertido: false },
  { id: "M2", dim: "M", texto: "Evalúo regularmente si la forma en que estoy estudiando está siendo efectiva.", invertido: false },
  { id: "M3", dim: "M", texto: "Ajusto mi método de estudio según el tipo de materia o tarea que tengo.", invertido: false },
  { id: "M4", dim: "M", texto: "Después de una evaluación, analizo qué estrategias funcionaron y cuáles no.", invertido: false },
  { id: "M5", dim: "M", texto: "Suelo seguir estudiando de la misma forma aunque no esté obteniendo buenos resultados.", invertido: true },
  { id: "M6", dim: "M", texto: "Rara vez me detengo a reflexionar sobre si mi forma de estudiar es la más adecuada.", invertido: true },
];

// Ítems de validez embebidos
const VALIDEZ = [
  { id: "V1", dim: "V", texto: "Nunca me he distraído durante una clase o sesión de estudio.", invertido: false, trampa: true, sospechoso: [4, 5] },
  { id: "V2", dim: "V", texto: "Siempre cumplo con todas mis tareas antes de la fecha límite sin ninguna excepción.", invertido: false, trampa: true, sospechoso: [5] },
  { id: "V3", dim: "V", texto: "Para esta pregunta, por favor selecciona «En desacuerdo» independientemente de tu opinión.", invertido: false, trampa: true, atencion: 2 },
];

// Escala bipolar direccional
const PREGUNTAS_BIPOLAR = [
  { id: "D1", textoA: "Prefiero dominar los elementos individuales antes de integrarlos en un todo.", textoB: "Prefiero entender el esquema completo antes de estudiar los componentes." },
  { id: "D2", textoA: "Construyo mi comprensión acumulando detalles concretos progresivamente.", textoB: "Comprendo mejor cuando primero veo el panorama general completo." },
  { id: "D3", textoA: "Me resulta natural ir de ejemplos específicos hacia conclusiones generales.", textoB: "Me resulta natural ir del concepto general hacia sus casos particulares." },
];

// Barajar array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Insertar ítems de validez en posiciones aleatorias
function buildOrden() {
  const mezcladas = shuffle(PREGUNTAS_RAW);
  const posiciones = shuffle([5, 12, 20, 28]).slice(0, 3);
  posiciones.sort((a, b) => a - b);
  const resultado = [...mezcladas];
  posiciones.forEach((pos, i) => resultado.splice(pos, 0, VALIDEZ[i]));
  return resultado;
}

// ─────────────────────────────────────────────
// CÁLCULO DEL PERFIL
// ─────────────────────────────────────────────

function calcularPerfil(respuestas, preguntasOrden, bipolar) {
  const scores = { E: [], R: [], A: [], St: [], M: [] };

  preguntasOrden.forEach((p) => {
    if (p.dim === "V") return;
    const val = respuestas[p.id];
    if (val === undefined) return;
    const score = p.invertido ? 6 - val : val;
    scores[p.dim].push(score);
  });

  const perfil = {};
  Object.keys(scores).forEach((dim) => {
    const arr = scores[dim];
    perfil[dim] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  });

  // Direccionalidad (1–7, promedio)
  const dScores = PREGUNTAS_BIPOLAR.map((p) => bipolar[p.id] || 4);
  perfil.D = dScores.reduce((a, b) => a + b, 0) / dScores.length;
  perfil.D_label = perfil.D < 3.5 ? "Bottom-up" : perfil.D > 4.5 ? "Top-down" : "Flexible";

  return perfil;
}

// Validez
function calcularValidez(respuestas) {
  let fallos = 0;
  if (respuestas["V1"] >= 4) fallos++;
  if (respuestas["V2"] === 5) fallos++;
  if (respuestas["V3"] !== 2) fallos++;
  return fallos;
}

// ─────────────────────────────────────────────
// RECOMENDACIONES
// ─────────────────────────────────────────────

function getRecomendacion(perfil) {
  const { E, R, A, St, M, D_label } = perfil;

  // Perfil en riesgo
  if (M < 2.5 && R > 3.5 && E < 2.5 && St < 2.5) {
    return {
      arquetipo: "Perfil en Desarrollo",
      color: "#F59E0B",
      emoji: "🌱",
      descripcion: "Tu aprendizaje depende mucho de la presión externa y aún estás construyendo hábitos de autorregulación. Esto es muy común y completamente superable.",
      tecnicas: [
        "Busca un compañero de estudio con quien hacer compromisos concretos y verificables",
        "Usa una agenda con bloques de estudio fijos — la estructura externa sustituye temporalmente la interna",
        "Empieza con sesiones de solo 25 minutos (Pomodoro) para construir tolerancia al esfuerzo",
        "Lleva un diario de reflexión de 3 minutos al final de cada sesión: ¿qué funcionó hoy?",
      ],
      metacognicion: "El primer paso es observarte estudiando sin juzgarte. Solo registra qué pasa."
    };
  }

  // Perfil Arquitecto
  if (E > 3.5 && St > 3.5) {
    return {
      arquetipo: "Arquitecto Cognitivo",
      color: "#6366F1",
      emoji: "🏛️",
      descripcion: "Piensas en sistemas. Necesitas ver la estructura completa antes de llenarla de contenido. Tu mayor fortaleza es la organización; tu riesgo es la parálisis por planificación excesiva.",
      tecnicas: [
        D_label === "Top-down"
          ? "Lee primero el índice, resumen y conclusiones de cualquier material antes de leerlo completo"
          : "Construye mapas conceptuales desde los conceptos más básicos hacia los integradores",
        "Método Cornell para tomar apuntes: divide la hoja en zona de apuntes, zona de claves y resumen",
        "Antes de cada sesión, escribe en una frase el objetivo concreto de esa sesión",
        M < 3 ? "Agrega un check de 5 minutos cada hora: ¿estoy cumpliendo el objetivo o me perdí en los detalles?" : "Tu metacognición es fuerte — úsala para detectar cuándo la planificación se convierte en procrastinación disfrazada",
      ],
      metacognicion: "Pregúntate: ¿estoy planificando para aprender o para evitar empezar?"
    };
  }

  // Perfil Corredor
  if (R > 3.5 && A > 3.5) {
    return {
      arquetipo: "Corredor de Fondo",
      color: "#EF4444",
      emoji: "⚡",
      descripcion: "Rindes mejor bajo presión y aprendiendo haciendo. Eres eficiente en sprints. Tu riesgo es depender tanto del deadline que no construyes conocimiento profundo a largo plazo.",
      tecnicas: [
        "Técnica Pomodoro estricta: 25 min de trabajo + 5 min de descanso, sin excepciones",
        "Crea tus propios deadlines artificiales — pon una alarma y comprométete con alguien a tener algo listo",
        "Resuelve ejercicios antes de leer la teoría (aprendizaje por error guiado)",
        "Usa flashcards activas (Anki) en lugar de releer apuntes — el esfuerzo de recordar consolida más",
      ],
      metacognicion: M < 3
        ? "Tu punto débil es la reflexión post-sesión. Dedica 3 minutos a escribir qué aprendiste realmente hoy — no qué estudiaste, qué aprendiste."
        : "Usa tu buena metacognición para detectar cuándo estás estudiando por sensación de urgencia vs. por comprensión real."
    };
  }

  // Perfil Ingeniero
  if (A > 3.5 && E > 3) {
    return {
      arquetipo: "Ingeniero del Conocimiento",
      color: "#10B981",
      emoji: "⚙️",
      descripcion: "Aprendes construyendo. Los ejemplos y la práctica son tu lenguaje nativo. Necesitas tocar el problema antes de entender la teoría que hay detrás.",
      tecnicas: [
        "Problem-based learning: empieza con un problema real que no puedas resolver, luego estudia la teoría para resolverlo",
        "Laboratorios y simulaciones antes que clases magistrales siempre que sea posible",
        "Cuando leas teoría, para cada concepto pregunta: ¿en qué ejercicio específico usaría esto?",
        D_label === "Bottom-up" ? "Construye tu propio glosario desde los términos más básicos hacia los más complejos" : "Dibuja el diagrama del sistema completo primero y luego rellena cómo funciona cada parte",
      ],
      metacognicion: "Verifica que no confundas hacer ejercicios con entender: ¿puedes explicar en voz alta por qué funciona tu solución?"
    };
  }

  // Perfil Visionario
  if (St > 3.5 && R < 3) {
    return {
      arquetipo: "Pensador Estratégico",
      color: "#8B5CF6",
      emoji: "🔭",
      descripcion: "Estudias mejor cuando ves el propósito claro. Te motiva el largo plazo más que los deadlines. Tu riesgo es la procrastinación cuando el sentido no es evidente.",
      tecnicas: [
        "Antes de cada tema, escribe explícitamente: ¿para qué me sirve esto en mis objetivos de vida/carrera?",
        "Aprendizaje basado en proyectos: conecta cada materia con un proyecto personal real",
        "Lee casos reales y artículos de divulgación antes de la teoría formal para activar tu motivación intrínseca",
        "Crea hitos intermedios con alguien que te pida cuentas — tu motor interno es potente pero necesita tracción externa",
      ],
      metacognicion: "Distingue entre 'no tiene sentido para mí' (legítimo, busca el contexto) y 'no me apetece ahora' (gestión del esfuerzo)."
    };
  }

  // Perfil Adaptativo (metacognición muy alta)
  if (M > 4) {
    return {
      arquetipo: "Aprendiz Adaptativo",
      color: "#06B6D4",
      emoji: "🧠",
      descripcion: "Tu metacognición es tu superpoder. Eres capaz de ajustar tu propio método. Tu próximo nivel es hacer ese proceso más deliberado y sistemático.",
      tecnicas: [
        "Estudia el modelo de autorregulación de Zimmerman y aplícalo conscientemente en cada sesión",
        "Mantén un diario de aprendizaje semanal: ¿qué cambié esta semana y por qué funcionó o no?",
        "Experimenta deliberadamente con técnicas diferentes (espaciado, intercalado, retrieval practice) y mide tus resultados",
        "Enseña lo que aprendes — el efecto protégé es una de las técnicas más potentes para quien ya tiene buena metacognición",
      ],
      metacognicion: "Ya te monitoreas bien. El siguiente paso es sistematizar ese monitoreo para que no dependa solo de la intuición."
    };
  }

  // Perfil por defecto (perfiles mixtos)
  return {
    arquetipo: "Perfil Equilibrado",
    color: "#3B82F6",
    emoji: "⚖️",
    descripcion: "Tienes un perfil balanceado entre varias dimensiones. Eres flexible cognitivamente, lo que es una ventaja real. Tu trabajo es identificar qué combinación específica activa tu mejor rendimiento.",
    tecnicas: [
      "Experimenta conscientemente: estudia el mismo tema con dos métodos distintos y evalúa cuál retuvo más",
      "Usa técnica Pomodoro con revisión al final de cada bloque: ¿qué funcionó en estos 25 minutos?",
      "Alterna entre lectura activa, resolución de problemas y elaboración de esquemas en cada sesión",
      "Lleva un registro de rendimiento por materia — probablemente tu perfil óptimo cambia según el tipo de contenido",
    ],
    metacognicion: "Tu equilibrio es tu ventaja. Aprender a activar conscientemente cada dimensión según el contexto es tu próximo nivel."
  };
}

// ─────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────

const styles = {
  // Paleta Blue
  bg: "#0A0E1A",
  bgCard: "#0F1628",
  bgCardHover: "#151D35",
  accent: "#4F8EF7",
  accentSoft: "#1E3A6E",
  text: "#E8EEFF",
  textMuted: "#7A8BB5",
  border: "#1E2D54",
};

function BarraProgreso({ actual, total }) {
  const pct = Math.round((actual / total) * 100);
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: styles.textMuted, fontSize: 13 }}>Pregunta {actual} de {total}</span>
        <span style={{ color: styles.accent, fontSize: 13, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: styles.accentSoft, borderRadius: 4 }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${styles.accent}, #7BB3FF)`,
          borderRadius: 4, transition: "width 0.4s ease"
        }} />
      </div>
    </div>
  );
}

function BotoneEscala({ valor, onChange, tipo = "likert" }) {
  if (tipo === "bipolar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 42, height: 42, borderRadius: "50%",
            border: `2px solid ${valor === n ? styles.accent : styles.border}`,
            background: valor === n ? styles.accent : "transparent",
            color: valor === n ? "#fff" : styles.textMuted,
            fontWeight: 700, fontSize: 15, cursor: "pointer",
            transition: "all 0.15s"
          }}>{n}</button>
        ))}
      </div>
    );
  }

  const etiquetas = ["", "Totalmente\nen desacuerdo", "En\ndesacuerdo", "Neutral", "De\nacuerdo", "Totalmente\nde acuerdo"];
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          padding: "12px 8px", minWidth: 70, borderRadius: 12,
          border: `2px solid ${valor === n ? styles.accent : styles.border}`,
          background: valor === n ? styles.accentSoft : "transparent",
          color: valor === n ? styles.accent : styles.textMuted,
          cursor: "pointer", transition: "all 0.15s", fontSize: 11,
          lineHeight: 1.3, whiteSpace: "pre-line", textAlign: "center"
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: valor === n ? styles.accent : styles.text }}>{n}</span>
          {etiquetas[n]}
        </button>
      ))}
    </div>
  );
}

function RadarSimple({ perfil }) {
  const dims = ["E", "R", "A", "St", "M"];
  const nombres = { E: "Estructural", R: "Reactiva", A: "Aplicada", St: "Estratégica", M: "Metacognitiva" };
  const colores = { E: "#6366F1", R: "#EF4444", A: "#10B981", St: "#8B5CF6", M: "#06B6D4" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {dims.map((d) => {
        const val = perfil[d] || 0;
        const pct = ((val - 1) / 4) * 100;
        return (
          <div key={d}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: styles.text, fontSize: 14 }}>{nombres[d]}</span>
              <span style={{ color: colores[d], fontWeight: 700, fontSize: 14 }}>{val.toFixed(1)}</span>
            </div>
            <div style={{ height: 8, background: styles.accentSoft, borderRadius: 8 }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: colores[d], borderRadius: 8,
                transition: "width 0.8s ease"
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// PANTALLAS
// ─────────────────────────────────────────────

function PantallaBienvenida({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
      <h1 style={{
        fontSize: 48, fontWeight: 900, margin: "0 0 8px",
        background: `linear-gradient(135deg, #4F8EF7, #A78BFA)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
      }}>Blue</h1>
      <p style={{ color: styles.textMuted, fontSize: 16, marginBottom: 8 }}>
        Evaluación de perfil cognitivo
      </p>
      <p style={{ color: styles.textMuted, fontSize: 13, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.7 }}>
        Responde con honestidad basándote en cómo estudias realmente,
        no en cómo crees que deberías estudiar. No hay respuestas correctas.
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        maxWidth: 360, margin: "0 auto 32px", textAlign: "left"
      }}>
        {[
          ["⏱️", "~15 minutos"],
          ["📊", "36 preguntas"],
          ["🔬", "5 dimensiones"],
          ["🎯", "Recomendación personalizada"],
        ].map(([icon, label]) => (
          <div key={label} style={{
            background: styles.bgCard, borderRadius: 10,
            padding: "10px 14px", border: `1px solid ${styles.border}`,
            display: "flex", alignItems: "center", gap: 8,
            color: styles.text, fontSize: 13
          }}>
            <span>{icon}</span>{label}
          </div>
        ))}
      </div>

      <p style={{ color: styles.textMuted, fontSize: 11, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>
        <strong style={{ color: styles.text }}>Aviso:</strong> Este test es una herramienta de autoconocimiento,
        no un diagnóstico psicológico ni clínico.
      </p>

      <button onClick={onStart} style={{
        padding: "14px 40px", borderRadius: 12,
        background: `linear-gradient(135deg, ${styles.accent}, #7BB3FF)`,
        color: "#fff", fontWeight: 700, fontSize: 16,
        border: "none", cursor: "pointer", letterSpacing: 0.5
      }}>
        Comenzar evaluación →
      </button>
    </div>
  );
}

function PantallaTest({ preguntas, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const pregunta = preguntas[idx];
  const respuestaActual = respuestas[pregunta.id];

  function responder(val) {
    setRespuestas((prev) => ({ ...prev, [pregunta.id]: val }));
  }

  function siguiente() {
    if (!respuestaActual) return;
    if (idx + 1 >= preguntas.length) {
      onComplete(respuestas);
    } else {
      setIdx(idx + 1);
    }
  }

  function anterior() {
    if (idx > 0) setIdx(idx - 1);
  }

  const esTrampa = pregunta.dim === "V" && pregunta.trampa;

  return (
    <div>
      <BarraProgreso actual={idx + 1} total={preguntas.length} />

      <div style={{
        background: styles.bgCard, borderRadius: 16,
        border: `1px solid ${styles.border}`, padding: "32px 28px",
        marginBottom: 24, minHeight: 180
      }}>
        {pregunta.dim !== "V" && (
          <span style={{
            display: "inline-block", marginBottom: 16, padding: "3px 10px",
            borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: 1,
            background: styles.accentSoft, color: styles.accent
          }}>
            {DIMENSIONES[pregunta.dim] || "Evaluación"}
          </span>
        )}
        <p style={{ color: styles.text, fontSize: 18, lineHeight: 1.6, margin: 0 }}>
          {pregunta.texto}
        </p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <BotoneEscala valor={respuestaActual} onChange={responder} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={anterior} disabled={idx === 0} style={{
          padding: "10px 22px", borderRadius: 10,
          background: "transparent", border: `1px solid ${styles.border}`,
          color: idx === 0 ? styles.border : styles.textMuted,
          cursor: idx === 0 ? "default" : "pointer", fontSize: 14
        }}>← Anterior</button>

        <button onClick={siguiente} disabled={!respuestaActual} style={{
          padding: "10px 28px", borderRadius: 10,
          background: respuestaActual
            ? `linear-gradient(135deg, ${styles.accent}, #7BB3FF)`
            : styles.accentSoft,
          color: respuestaActual ? "#fff" : styles.border,
          border: "none", cursor: respuestaActual ? "pointer" : "default",
          fontWeight: 700, fontSize: 14, transition: "all 0.15s"
        }}>
          {idx + 1 >= preguntas.length ? "Ver resultados →" : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}

function PantallaBipolar({ onComplete }) {
  const [respuestas, setRespuestas] = useState({});
  const [idx, setIdx] = useState(0);
  const pregunta = PREGUNTAS_BIPOLAR[idx];
  const val = respuestas[pregunta.id];

  function siguiente() {
    if (!val) return;
    if (idx + 1 >= PREGUNTAS_BIPOLAR.length) {
      onComplete(respuestas);
    } else {
      setIdx(idx + 1);
    }
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ color: styles.text, fontSize: 20, marginBottom: 6 }}>Escala de Direccionalidad</h2>
        <p style={{ color: styles.textMuted, fontSize: 13 }}>
          Indica con qué afirmación te identificas más. 1 = completamente A, 7 = completamente B.
        </p>
      </div>

      <BarraProgreso actual={idx + 1} total={PREGUNTAS_BIPOLAR.length} />

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        marginBottom: 28
      }}>
        {[
          { label: "A — Bottom-up", texto: pregunta.textoA, color: "#10B981" },
          { label: "B — Top-down", texto: pregunta.textoB, color: "#8B5CF6" },
        ].map(({ label, texto, color }) => (
          <div key={label} style={{
            background: styles.bgCard, borderRadius: 12,
            border: `1px solid ${styles.border}`, padding: "18px 16px"
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1, display: "block", marginBottom: 8 }}>{label}</span>
            <p style={{ color: styles.text, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{texto}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 340, fontSize: 11, color: styles.textMuted }}>
          <span>← Más A</span>
          <span>Neutral</span>
          <span>Más B →</span>
        </div>
        <BotoneEscala valor={val} onChange={(v) => setRespuestas((p) => ({ ...p, [pregunta.id]: v }))} tipo="bipolar" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={siguiente} disabled={!val} style={{
          padding: "10px 28px", borderRadius: 10,
          background: val ? `linear-gradient(135deg, ${styles.accent}, #7BB3FF)` : styles.accentSoft,
          color: val ? "#fff" : styles.border,
          border: "none", cursor: val ? "pointer" : "default",
          fontWeight: 700, fontSize: 14
        }}>
          {idx + 1 >= PREGUNTAS_BIPOLAR.length ? "Calcular perfil →" : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}

function PantallaCargando() {
  const [paso, setPaso] = useState(0);
  const pasos = ["Procesando respuestas...", "Calculando dimensiones...", "Identificando patrón cognitivo...", "Generando recomendaciones..."];

  useEffect(() => {
    const t = setInterval(() => setPaso((p) => Math.min(p + 1, pasos.length - 1)), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 24, animation: "spin 2s linear infinite" }}>⚙️</div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <h2 style={{ color: styles.text, fontSize: 22, marginBottom: 24 }}>Analizando tu perfil</h2>
      {pasos.map((p, i) => (
        <div key={p} style={{
          color: i <= paso ? styles.accent : styles.border,
          marginBottom: 10, fontSize: 14, transition: "color 0.3s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <span>{i <= paso ? "✓" : "○"}</span> {p}
        </div>
      ))}
    </div>
  );
}

function PantallaResultados({ perfil, fallosValidez, onReiniciar }) {
  const rec = getRecomendacion(perfil);
  const advertencia = fallosValidez >= 2;

  return (
    <div>
      {advertencia && (
        <div style={{
          background: "#2D1A00", border: "1px solid #F59E0B",
          borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          color: "#FCD34D", fontSize: 13
        }}>
          ⚠️ Algunas respuestas presentaron inconsistencias. El perfil puede no ser completamente representativo. Te recomendamos repetir el test con más calma.
        </div>
      )}

      {/* Arquetipo */}
      <div style={{
        textAlign: "center", marginBottom: 28,
        background: styles.bgCard, borderRadius: 16,
        border: `1px solid ${styles.border}`, padding: "28px 20px"
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{rec.emoji}</div>
        <h2 style={{ color: rec.color, fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>{rec.arquetipo}</h2>
        <p style={{ color: styles.textMuted, fontSize: 14, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>{rec.descripcion}</p>
      </div>

      {/* Perfil vectorial */}
      <div style={{
        background: styles.bgCard, borderRadius: 16,
        border: `1px solid ${styles.border}`, padding: "24px",
        marginBottom: 20
      }}>
        <h3 style={{ color: styles.text, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Tu vector cognitivo</h3>
        <RadarSimple perfil={perfil} />

        <div style={{
          marginTop: 20, padding: "12px 16px", borderRadius: 10,
          background: styles.accentSoft, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ color: styles.textMuted, fontSize: 13 }}>Direccionalidad cognitiva</span>
          <span style={{
            fontWeight: 700, fontSize: 14,
            color: perfil.D_label === "Bottom-up" ? "#10B981" : perfil.D_label === "Top-down" ? "#8B5CF6" : styles.accent
          }}>{perfil.D_label} ({perfil.D?.toFixed(1)})</span>
        </div>
      </div>

      {/* Técnicas recomendadas */}
      <div style={{
        background: styles.bgCard, borderRadius: 16,
        border: `1px solid ${styles.border}`, padding: "24px",
        marginBottom: 20
      }}>
        <h3 style={{ color: styles.text, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          🎯 Técnicas recomendadas para ti
        </h3>
        {rec.tecnicas.map((t, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, marginBottom: 14,
            padding: "12px 14px", borderRadius: 10,
            background: styles.bg, border: `1px solid ${styles.border}`
          }}>
            <span style={{ color: rec.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            <p style={{ color: styles.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{t}</p>
          </div>
        ))}
      </div>

      {/* Reflexión metacognitiva */}
      <div style={{
        borderRadius: 16, padding: "20px 24px", marginBottom: 28,
        background: `linear-gradient(135deg, #0D1F3C, #1A1040)`,
        border: `1px solid ${styles.border}`
      }}>
        <p style={{ color: styles.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
          💡 REFLEXIÓN METACOGNITIVA
        </p>
        <p style={{ color: styles.text, fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
          "{rec.metacognicion}"
        </p>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ color: styles.textMuted, fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>
          Este perfil es una herramienta de autoconocimiento. No constituye un diagnóstico psicológico ni clínico.
        </p>
        <button onClick={onReiniciar} style={{
          padding: "10px 24px", borderRadius: 10,
          background: "transparent", border: `1px solid ${styles.border}`,
          color: styles.textMuted, cursor: "pointer", fontSize: 13
        }}>
          Repetir evaluación
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────

export default function App() {
  const [pantalla, setPantalla] = useState("bienvenida"); // bienvenida | test | bipolar | cargando | resultados
  const [preguntasOrden] = useState(() => buildOrden());
  const [respuestas, setRespuestas] = useState({});
  const [bipolarResp, setBipolarResp] = useState({});
  const [perfil, setPerfil] = useState(null);
  const [fallosValidez, setFallosValidez] = useState(0);
  const [ipvResultado, setIpvResultado] = useState(null);

  function handleTestComplete(resp) {
    setRespuestas(resp);
    setPantalla("bipolar");
  }

  function handleBipolarComplete(bipResp) {
    setBipolarResp(bipResp);
    setPantalla("cargando");
    setTimeout(() => {
      const p = calcularPerfil({ ...respuestas }, preguntasOrden, bipResp);
      const f = calcularValidez(respuestas);
      setPerfil(p);
      setFallosValidez(f);
      setPantalla("resultados");
    }, 2800);
  }

  function reiniciar() {
    setRespuestas({});
    setBipolarResp({});
    setPerfil(null);
    setPantalla("bienvenida");
    window.location.reload(); // reconstruye orden aleatorio
  }

  return (
    <div style={{
      minHeight: "100vh", background: styles.bg,
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      padding: "24px 16px", fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${styles.accent}, #7BB3FF)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: "#fff", fontSize: 16
          }}>B</div>
          <span style={{ color: styles.text, fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>Blue</span>
          <span style={{ color: styles.textMuted, fontSize: 12, marginLeft: 4 }}>Perfil Cognitivo</span>
        </div>

        {/* Contenido */}
        {pantalla === "bienvenida" && <PantallaBienvenida onStart={() => setPantalla("test")} />}
        {pantalla === "test" && (
  <>
    <CamaraConcentracion
      activa={true}
      onResult={(r) => setIpvResultado(r)}
    />
    <PantallaTest preguntas={preguntasOrden} onComplete={handleTestComplete} />
  </>
)}
        {pantalla === "bipolar" && <PantallaBipolar onComplete={handleBipolarComplete} />}
        {pantalla === "cargando" && <PantallaCargando />}
        {pantalla === "resultados" && perfil && (
          <PantallaResultados perfil={perfil} fallosValidez={fallosValidez} onReiniciar={reiniciar} />
        )}
      </div>
    </div>
  );
}
