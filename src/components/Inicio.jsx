import { useNavigate } from "react-router-dom";

const styles = {
  bg: "#0A0E1A",
  bgCard: "#0F1628",
  accent: "#4F8EF7",
  accentSoft: "#1E3A6E",
  text: "#E8EEFF",
  textMuted: "#7A8BB5",
  border: "#1E2D54",
};

export default function Inicio() {
  const navigate = useNavigate();

  const tarjetas = [
    {
      emoji: "🧠",
      titulo: "Test Cognitivo",
      descripcion:
        "Descubre tu perfil de aprendizaje en 5 dimensiones y recibe una recomendación personalizada para mejorar tu rendimiento académico.",
      boton: "Comenzar test",
      ruta: "/test",
      color: "#4F8EF7",
      detalle: ["~15 minutos", "36 preguntas", "Resultado inmediato"],
    },
    {
      emoji: "📷",
      titulo: "Sala de Estudio",
      descripcion:
        "Activa el monitoreo de presencia mientras estudias. La cámara mide tu Índice de Presencia Visual en tiempo real sin guardar imágenes.",
      boton: "Entrar a la sala",
      ruta: "/sala",
      color: "#34D399",
      detalle: ["Cámara local", "Sin grabación", "IPV en tiempo real"],
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: styles.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "linear-gradient(135deg, #4F8EF7, #7BB3FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            color: "#fff",
            fontSize: 28,
            margin: "0 auto 20px",
            boxShadow: "0 0 40px rgba(79,142,247,0.3)",
          }}
        >
          B
        </div>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 900,
            margin: "0 0 10px",
            background: "linear-gradient(135deg, #4F8EF7, #A78BFA)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -1,
          }}
        >
          Blue
        </h1>
        <p style={{ color: styles.textMuted, fontSize: 16, margin: 0 }}>
          Plataforma de apoyo académico cognitivo
        </p>
      </div>

      {/* Tarjetas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          width: "100%",
          maxWidth: 680,
          marginBottom: 48,
        }}
      >
        {tarjetas.map((t) => (
          <div
            key={t.ruta}
            style={{
              background: styles.bgCard,
              border: `1px solid ${styles.border}`,
              borderRadius: 20,
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Icono */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `${t.color}18`,
                border: `1px solid ${t.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              {t.emoji}
            </div>

            {/* Texto */}
            <div>
              <h2
                style={{
                  color: styles.text,
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "0 0 8px",
                }}
              >
                {t.titulo}
              </h2>
              <p
                style={{
                  color: styles.textMuted,
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {t.descripcion}
              </p>
            </div>

            {/* Detalles */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {t.detalle.map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: `${t.color}15`,
                    color: t.color,
                    letterSpacing: 0.3,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Botón */}
            <button
              onClick={() => navigate(t.ruta)}
              style={{
                marginTop: 8,
                padding: "12px 20px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                letterSpacing: 0.3,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {t.boton} →
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          color: styles.textMuted,
          fontSize: 11,
          textAlign: "center",
          lineHeight: 1.7,
          maxWidth: 400,
        }}
      >
        Blue es una herramienta de autoconocimiento académico. No constituye un
        diagnóstico psicológico ni clínico. Los datos de cámara se procesan
        localmente y nunca se envían a ningún servidor.
      </p>
    </div>
  );
}
