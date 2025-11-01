// components/EditItemModal.jsx
"use client";
import { useEffect, useState } from "react";

export default function EditItemModal({ open, item, onClose, onSave }) {
  const [form, setForm] = useState(toLocal(item));

  useEffect(() => {
    setForm(toLocal(item));
  }, [item]);

  if (!open || !item) return null;

  // price helpers
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

  function addLink() {
    if (!form._url) return;
    const links = [...(form.links || []), { platform: form._platform || "amazon", url: form._url }];
    setForm({ ...form, links, _url: "" });
  }
  function removeLink(i) {
    const links = [...form.links];
    links.splice(i, 1);
    setForm({ ...form, links });
  }

  function handleSave() {
    const patch = {
      name: form.name.trim(),
      price: form.priceInput === "" ? null : Number.parseFloat(form.priceInput),
      color: form.color || "",
      size: form.size || "",
      priority: form.priority,
      note: form.note || "",
      links: form.links || [],
    };
    onSave(patch);
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Edit item">
      <div className="modal-card modal-responsive">
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>Edit item</h3>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>

        <div className="modal-body">
          <div className="grid form-grid">
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

            <div style={{ gridColumn: "1 / -1" }}>
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
            <div style={{ display: "flex", alignItems: "end" }}>
              <button className="secondary" onClick={addLink}>Add Link</button>
            </div>

            <div className="row wrap" style={{ gridColumn: "1 / -1" }}>
              {(form.links||[]).map((l,i)=>(
                <span key={i} className="badge">
                  {l.platform}
                  <button className="tiny" onClick={()=>removeLink(i)}>✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

function toLocal(item){
  if (!item) return {
    name:"", priceInput:"", color:"", size:"", priority:"medium", note:"",
    links:[], _platform:"amazon", _url:""
  };
  return {
    name: item.name || "",
    priceInput: item.price != null ? String(item.price) : "",
    color: item.color || "",
    size: item.size || "",
    priority: item.priority || "medium",
    note: item.note || "",
    links: item.links || [],
    _platform: "amazon",
    _url: ""
  };
}
