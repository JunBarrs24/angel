// Pantalla de la Tienda: canjear estrellas por premios reales, mostrados como
// "boletos" vistosos. Confirmación simple antes de gastar. Historial de canjes.

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { usePurchase, useStore } from "../api/hooks";
import type { Redemption, StoreItem } from "../api/types";
import { ConfirmModal } from "../components/ConfirmModal";
import { useChild } from "../hooks/useChild";
import { celebrate } from "../lib/celebrate";

export function StoreScreen() {
  const navigate = useNavigate();
  const { childId } = useChild();
  const { data, isLoading, isError } = useStore(childId);
  const purchase = usePurchase();

  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [justBought, setJustBought] = useState<Redemption | null>(null);

  if (childId == null) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>🛒</p>
        <p>Abriendo la tienda…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>😴</p>
        <p>No pudimos abrir la tienda.</p>
        <button className="btn" onClick={() => navigate("/mapa")}>
          🗺️ Volver al mapa
        </button>
      </div>
    );
  }

  const available = data.stars_available;

  function confirmPurchase() {
    if (!selected) return;
    purchase.mutate(
      { childId: childId as number, itemKey: selected.key },
      {
        onSuccess: (res) => {
          celebrate("big");
          setSelected(null);
          setJustBought(res.redemption);
        },
      },
    );
  }

  return (
    <div className="pantalla">
      <header className="cabecera">
        <button
          type="button"
          className="btn btn--fantasma"
          style={{ padding: "10px 18px", minHeight: 48 }}
          onClick={() => navigate("/mapa")}
        >
          ← Mapa
        </button>
        <h1 style={{ margin: 0 }}>🛒 Tienda</h1>
      </header>

      <div
        className="card centro"
        style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}
      >
        <p style={{ margin: 0, fontWeight: 800 }}>Tienes para gastar</p>
        <p style={{ margin: 0, fontSize: "2.6rem", fontWeight: 900 }}>⭐ {available}</p>
        <p className="texto-suave" style={{ margin: 0 }}>
          Ganadas: {data.stars_earned} · Gastadas: {data.stars_spent}
        </p>
      </div>

      {/* Aviso de canje exitoso. */}
      <AnimatePresence>
        {justBought && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="card"
            style={{
              marginBottom: 20,
              background: "linear-gradient(160deg, #d6ffe9, #b6f5cf)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "2.4rem", margin: 0 }} aria-hidden="true">
              {justBought.emoji}
            </p>
            <p style={{ fontWeight: 800, margin: "6px 0" }}>
              ¡Canjeaste {justBought.title}! Muéstraselo a papá o mamá para recibir tu premio. 🎉
            </p>
            <button type="button" className="btn btn--verde" onClick={() => setJustBought(null)}>
              ¡Genial!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {data.items.map((item) => {
          const afford = available >= item.cost;
          const missing = item.cost - available;
          return (
            <div
              key={item.key}
              className={`boleto ${afford ? "" : "boleto--nope"}`}
              style={{ "--boleto-color": `var(--${item.color})` } as CSSProperties}
            >
              <span style={{ fontSize: "3.4rem" }} aria-hidden="true">
                {item.emoji}
              </span>
              <strong style={{ fontSize: "1.3rem" }}>{item.title}</strong>
              <span className="texto-suave" style={{ fontSize: "0.95rem" }}>
                {item.description}
              </span>
              <span className="boleto__precio">⭐ {item.cost}</span>
              {afford ? (
                <button
                  type="button"
                  className="btn btn--verde"
                  style={{ marginTop: 6 }}
                  onClick={() => setSelected(item)}
                >
                  Canjear
                </button>
              ) : (
                <span style={{ marginTop: 6, fontWeight: 800, color: "var(--tinta-suave)" }}>
                  Te faltan {missing} ⭐
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Historial de canjes. */}
      {data.redemptions.length > 0 && (
        <section className="card" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>🎫 Mis canjes</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {data.redemptions.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#f4f6fb",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: "2rem" }} aria-hidden="true">
                  {r.emoji}
                </span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 800 }}>{r.title}</div>
                  <div className="texto-suave" style={{ fontSize: "0.85rem" }}>
                    {new Date(r.created_at).toLocaleDateString("es")}
                  </div>
                </div>
                <span style={{ fontWeight: 800 }}>−{r.cost} ⭐</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmModal
        open={selected !== null}
        emoji={selected?.emoji}
        title={selected ? `¿Canjear ${selected.title}?` : ""}
        confirmLabel={purchase.isPending ? "Canjeando…" : `Sí, gastar ${selected?.cost ?? 0} ⭐`}
        confirmDisabled={purchase.isPending}
        onConfirm={confirmPurchase}
        onCancel={() => setSelected(null)}
      >
        <p style={{ marginTop: 0 }}>
          Vas a gastar <strong>{selected?.cost} estrellas</strong>. Te quedarán{" "}
          <strong>{available - (selected?.cost ?? 0)} ⭐</strong>.
        </p>
      </ConfirmModal>
    </div>
  );
}
