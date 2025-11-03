// components/ItemCard.jsx
"use client";
import { useEffect, useState } from "react";
import { changeStatus } from "@/services/items";

function StatusChip({ status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`chip chip-${status}`}>{label}</span>;
}

function LinkBadge({ platform, url }) {
  const label = platform === "other" ? "Link" : platform;
  return (
    <a className="badge" href={url} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

/**
 * Props:
 * - listId
 * - item (doc data + id)
 * - me   = { uid, name, ready }  // ready => anon auth + name set
 * - editable (owner manage view)
 * - onEdit()
 */
export default function ItemCard({ listId, item, me = {}, editable = false, onEdit }) {
  const {
    id,
    name,
    price,
    currency,
    color,
    size,
    note,
    priority,
    links = [],
    status,
    reservedByUid,
    reservedByName,
    purchasedByUid,
    purchasedByName,
  } = item;

  const [busy, setBusy] = useState(false);

  // if the Firestore doc changes under us, clear any local busy state
  useEffect(() => {
    setBusy(false);
  }, [status, reservedByUid, purchasedByUid, id]);

  const meReady = Boolean(me?.uid && me?.name && me?.ready !== false);

  const isMineReserved   = status === "reserved"  && reservedByUid  === me?.uid;
  const isMinePurchased  = status === "purchased" && purchasedByUid === me?.uid;

  // Visibility rules
  const canShowReserve                 = status === "available" && meReady;
  const canShowPurchaseFromAvailable   = status === "available" && meReady;
  const canShowUnreserve               = isMineReserved;
  const canShowPurchaseFromReserved    = isMineReserved;      // only the reserver can mark purchased
  const canShowUndoPurchase            = isMinePurchased;

  async function act(action) {
    if (!meReady || busy) return;
    try {
      setBusy(true);
      await changeStatus(listId, id, action, { uid: me.uid, name: me.name });
    } catch (e) {
      // keep this generic; don't leak DB details
      console.warn("Action failed.");
    } finally {
      // we also clear on snapshot via useEffect; this is just a fallback
      setBusy(false);
    }
  }

  return (
    <div className="item-card">
      {/* Header */}
      <div className="item-head">
        <h4 className="item-name">{name}</h4>
        <StatusChip status={status} />
      </div>

      {/* Details */}
      <div className="item-meta">
        {price != null && (
          <div className="price">
            <strong>${Number(price).toFixed(2)}</strong> {currency || ""}
          </div>
        )}
        {color && <div><strong>Color:</strong> {color}</div>}
        {size &&  <div><strong>Size:</strong> {size}</div>}
        {priority && (
          <div><strong>Priority:</strong> {priority.charAt(0).toUpperCase() + priority.slice(1)}</div>
        )}
        {note &&  <div><strong>Note:</strong> {note}</div>}
      </div>

      {/* Links */}
      {links?.length > 0 && (
        <div className="links">
          {links.map((l, i) => (
            <LinkBadge key={i} platform={l.platform} url={l.url} />
          ))}
        </div>
      )}

      {/* Who reserved/purchased */}
      <div className="byline">
        {status === "reserved"  && reservedByName  && <span>Reserved by {reservedByName}</span>}
        {status === "purchased" && purchasedByName && <span>Purchased by {purchasedByName}</span>}
      </div>

      {/* Actions */}
      <div className="actions" key={`${status}-${reservedByUid || "none"}-${purchasedByUid || "none"}`}>
        {/* Available */}
        {canShowReserve && (
          <button disabled={busy} onClick={() => act("reserve")}>Reserve</button>
        )}
        {canShowPurchaseFromAvailable && (
          <button disabled={busy} onClick={() => act("purchase")}>Mark Purchased</button>
        )}

        {/* Reserved (only by the same user) */}
        {canShowUnreserve && (
          <button disabled={busy} onClick={() => act("unreserve")}>Unreserve</button>
        )}
        {canShowPurchaseFromReserved && (
          <button disabled={busy} onClick={() => act("purchase")}>Mark Purchased</button>
        )}

        {/* Purchased (only by the same user) */}
        {canShowUndoPurchase && (
          <button disabled={busy} onClick={() => act("unpurchase")}>Undo Purchased</button>
        )}

        {/* Hint if they can't act yet */}
        {!meReady && status === "available" && (
          <span className="muted" style={{ marginLeft: "auto" }}>
            Sign in to reserve
          </span>
        )}

        {/* Owner edit (manage view) */}
        {editable && (
          <button className="secondary" onClick={() => onEdit?.(item)}>Edit</button>
        )}
      </div>
    </div>
  );
}
