// app/l/[url]/manage/page.js
"use client";
import { use, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { auth } from "@/services/firebase";
import { getListByUrl } from "@/services/lists";
import useRealtimeItems from "@/lib/useRealtimeItems";
import ItemCard from "@/components/ItemCard";
import OwnerHeader from "@/components/OwnerHeader";
import { addItem, removeItem, updateItem } from "@/services/items";
import Alert from "@/components/Alert";
import EditItemModal from "@/components/EditItemModal";

export default function ManagePage(props) {
  const { url } = use(props.params);
  return (
    <AuthGate>
      <Manage url={url} />
    </AuthGate>
  );
}

function Manage({ url }) {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(blankItem());
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  // editor modal state
  const [editing, setEditing] = useState(null); // item object or null
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const l = await getListByUrl(url);
      if (!l || l.ownerUid !== auth.currentUser?.uid) {
        setErrorMsg("You do not have permission to manage this list, or it does not exist.");
      } else {
        setList(l);
      }
      setLoading(false);
    })();
  }, [url]);

  const items = useRealtimeItems(list?.id);

  // ---- price helpers for Add form ----
  function onPriceChange(e) {
    const v = e.target.value;
    if (v === "" || /^[0-9]*\.?[0-9]*$/.test(v)) {
      setForm({ ...form, priceInput: v });
    }
  }
  function onPriceBlur() {
    const v = form.priceInput;
    if (v === "" || v === ".") return setForm({ ...form, priceInput: "" });
    const num = parseFloat(v);
    setForm({ ...form, priceInput: Number.isFinite(num) ? num.toFixed(2) : "" });
  }

  async function addNew() {
    setSaving(true);
    try {
      const price = form.priceInput === "" ? null : Number.parseFloat(form.priceInput);
      await addItem(list.id, { ...form, price });
      setForm(blankItem());
    } catch (e) {
      setErrorMsg("We couldn’t add that item. Please check your fields and try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function onEditSave(itemId, patch) {
    try {
      await updateItem(list.id, itemId, patch);
    } catch (e) {
      setErrorMsg("We couldn’t save those changes. Please try again.");
      console.error(e);
    }
  }

  async function onDelete(itemId) {
    if (!confirm("Delete this item?")) return;
    try {
      await removeItem(list.id, itemId);
    } catch (e) {
      setErrorMsg("We couldn’t delete that item. Please try again.");
      console.error(e);
    }
  }

  if (loading) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      {errorMsg && <Alert message={errorMsg} onClose={() => setErrorMsg("")} />}

      {list ? (
        <>
          <OwnerHeader title={list.title} url={list.url} />

          <section className="panel">
            <h3 style={{marginTop:0}}>Add item</h3>

            <div className="grid form-grid spacious-grid">
              <div>
                <label>Item name</label>
                <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
              </div>

              <div>
                <label>Price</label>
                <input
                  inputMode="decimal"
                  placeholder="e.g., 24.99"
                  value={form.priceInput}
                  onChange={onPriceChange}
                  onBlur={onPriceBlur}
                />
              </div>

              <div>
                <label>Color</label>
                <input value={form.color} onChange={(e)=>setForm({...form, color:e.target.value})}/>
              </div>

              <div>
                <label>Size</label>
                <input value={form.size} onChange={(e)=>setForm({...form, size:e.target.value})}/>
              </div>

              <div>
                <label>Priority</label>
                <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div style={{gridColumn:"1 / -1"}}>
                <label>Note</label>
                <input value={form.note} onChange={(e)=>setForm({...form, note:e.target.value})}/>
              </div>

              <div>
                <label>Add a link</label>
                <select value={form._platform} onChange={(e)=>setForm({...form, _platform:e.target.value})}>
                  <option value="amazon">Amazon</option>
                  <option value="bestbuy">Best Buy</option>
                  <option value="tiktok">TikTok Shop</option>
                  <option value="temu">Temu</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Product URL</label>
                <input placeholder="https://…" value={form._url} onChange={(e)=>setForm({...form, _url:e.target.value})}/>
              </div>
              <div style={{display:"flex",alignItems:"end"}}>
                <button className="secondary" onClick={()=>{
                  if (!form._url) return;
                  const links = [...(form.links||[]), { platform: form._platform, url: form._url }];
                  setForm({ ...form, links, _url: "" });
                }}>Add Link</button>
              </div>

              <div className="row wrap" style={{gridColumn:"1 / -1"}}>
                {(form.links||[]).map((l,i)=>(
                  <span key={i} className="badge">
                    {l.platform}
                    <button className="tiny" onClick={()=>{
                      const links = [...form.links]; links.splice(i,1); setForm({...form, links});
                    }}>✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="row" style={{justifyContent:"flex-end"}}>
              <button onClick={addNew} disabled={saving || !form.name}>
                {saving ? "Adding…" : "Add Item"}
              </button>
            </div>
          </section>

          <h3>Your items</h3>

          {/* Roomier grid for manage view */}
          <div className="grid manage-grid">
            {items?.map((it)=>(
              <div key={it.id} className="item-manage">
                <ItemCard
                  listId={list.id}
                  item={it}
                  me={{ uid: "owner", name: "Owner" }}
                  editable={false}           // hide inline "Edit" button on card
                />
                <div className="item-actions">
                  <button className="secondary" onClick={() => { setEditing(it); setEditorOpen(true); }}>Edit</button>
                  <button className="danger" onClick={()=>onDelete(it.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Editor modal */}
          <EditItemModal
            open={editorOpen}
            item={editing}
            onClose={()=>{ setEditorOpen(false); setEditing(null); }}
            onSave={async (patch)=>{
              await onEditSave(editing.id, patch);
              setEditorOpen(false);
              setEditing(null);
            }}
          />
        </>
      ) : (
        <div className="container" />
      )}
    </div>
  );
}

function blankItem() {
  return {
    name: "",
    priceInput: "",
    color: "",
    size: "",
    priority: "medium",
    note: "",
    links: [],
    _platform: "amazon",
    _url: "",
  };
}
