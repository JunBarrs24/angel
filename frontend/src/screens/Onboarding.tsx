// Pantalla 1 — Perfil: elegir avatar de dino + nombre. Crea el Child en el
// backend y guarda el child_id en localStorage.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useCreateChild } from "../api/hooks";
import { AVATARS } from "../data/avatars";
import { useChild } from "../hooks/useChild";

const DEFAULT_NAME = "Ángel Eduardo";

export function Onboarding() {
  const navigate = useNavigate();
  const { setChildId } = useChild();
  const createChild = useCreateChild();
  const [name, setName] = useState(DEFAULT_NAME);
  const [avatar, setAvatar] = useState(AVATARS[0].key);

  // Vincular con un explorador existente (jugar en otro dispositivo).
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState(false);

  function start() {
    createChild.mutate(
      { name: name.trim() || DEFAULT_NAME, avatar },
      {
        onSuccess: (child) => {
          setChildId(child.id);
          navigate("/mapa");
        },
      },
    );
  }

  async function link() {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setLinking(true);
    setLinkError(false);
    try {
      const child = await api.getChildByCode(clean);
      setChildId(child.id);
      navigate("/mapa");
    } catch {
      setLinkError(true);
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="pantalla centro">
      <h1>🦖 Misión Dino</h1>
      <p className="texto-suave" style={{ maxWidth: 520 }}>
        ¡Prepárate para una aventura de 40 días entre dinosaurios! Elige tu dino y tu nombre,
        explorador.
      </p>

      <div className="card" style={{ width: "100%", maxWidth: 620 }}>
        <h2>Elige tu dino</h2>
        <div
          role="radiogroup"
          aria-label="Elige tu dino"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {AVATARS.map((dino) => {
            const selected = dino.key === avatar;
            return (
              <button
                key={dino.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAvatar(dino.key)}
                className="btn btn--fantasma"
                style={{
                  flexDirection: "column",
                  gap: 4,
                  padding: "16px 8px",
                  boxShadow: selected
                    ? `0 0 0 4px ${dino.color}, var(--sombra-suave)`
                    : "inset 0 0 0 3px #e3e8f5",
                  background: selected ? "var(--crema)" : "#fff",
                }}
              >
                <span style={{ fontSize: "2.6rem" }} aria-hidden="true">
                  {dino.emoji}
                </span>
                <span style={{ fontSize: "1rem" }}>{dino.name}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="nombre" style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
          ¿Cómo te llamas?
        </label>
        <input
          id="nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          style={{
            width: "100%",
            fontSize: "1.4rem",
            padding: "14px 18px",
            borderRadius: "var(--radio)",
            border: "3px solid #e3e8f5",
            fontFamily: "inherit",
            textAlign: "center",
          }}
        />
      </div>

      <button
        type="button"
        className="btn btn--verde btn--grande"
        onClick={start}
        disabled={createChild.isPending}
      >
        {createChild.isPending ? "Preparando…" : "¡Empezar aventura! 🚀"}
      </button>

      {createChild.isError && (
        <p style={{ color: "var(--rojo)", fontWeight: 700 }}>
          Ups, no pudimos empezar. ¿El servidor está encendido? Intenta de nuevo.
        </p>
      )}

      {/* Vincular con un explorador que ya existe en otro dispositivo. */}
      <div className="card" style={{ width: "100%", maxWidth: 620 }}>
        <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>¿Ya juegas en otro dispositivo? 📱➡️📋</h2>
        <p className="texto-suave" style={{ marginTop: 0 }}>
          Escribe tu <strong>código de explorador</strong> para continuar la misma aventura (lo ves
          en “Mis logros”).
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <input
            aria-label="Código de explorador"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setLinkError(false);
            }}
            placeholder="Ej. C2RU8"
            maxLength={8}
            style={{
              flex: "1 1 200px",
              fontSize: "1.4rem",
              fontWeight: 800,
              letterSpacing: 3,
              textAlign: "center",
              textTransform: "uppercase",
              padding: "12px 16px",
              borderRadius: "var(--radio)",
              border: "3px solid #e3e8f5",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            className="btn btn--morado"
            onClick={link}
            disabled={linking || code.trim().length === 0}
          >
            {linking ? "Buscando…" : "Vincular 🔗"}
          </button>
        </div>
        {linkError && (
          <p style={{ color: "var(--rojo)", fontWeight: 700, marginBottom: 0 }}>
            No encontramos ese código. Revísalo e intenta otra vez.
          </p>
        )}
      </div>
    </div>
  );
}
