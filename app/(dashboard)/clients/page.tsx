"use client";

import { useState, useEffect } from "react";
import { Plus, Phone, Mail, MapPin } from "lucide-react";
import { getClients, createClient } from "@/app/actions/clients";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import type { Client } from "@/app/db/schema";

export default function ClientsPage() {
  const [clientList, setClientList] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClients().then(setClientList);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await createClient({
      name: fd.get("name") as string,
      contactPerson: (fd.get("contactPerson") as string) || null,
      phone: (fd.get("phone") as string) || null,
      email: (fd.get("email") as string) || null,
      address: (fd.get("address") as string) || null,
    });
    const updated = await getClients();
    setClientList(updated);
    setShowForm(false);
    setSaving(false);
  }

  const fieldCls =
    "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <>
      <PageHeader
        title="Client Database"
        subtitle="Bank contacts and client information"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Add Client
          </button>
        }
      />

      {/* Inline Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-5 mb-6 animate-fade-in-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Bank / Company Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. Saraswat Bank"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Contact Person</label>
              <input
                name="contactPerson"
                placeholder="Branch manager name"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="contact@bank.com"
                className={fieldCls}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>Address</label>
            <input
              name="address"
              placeholder="Branch address"
              className={fieldCls}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Client"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Client List */}
      {clientList.length === 0 && !showForm ? (
        <EmptyState
          title="No clients yet"
          message="Add your first bank or company client."
        />
      ) : (
        <div className="grid gap-4">
          {clientList.map((c) => (
            <div
              key={c.id}
              className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <h3 className="text-[15px] font-normal text-muted mb-2">
                {c.name}
              </h3>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-muted">
                {c.contactPerson && <span>{c.contactPerson}</span>}
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> {c.phone}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} /> {c.email}
                  </span>
                )}
                {c.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {c.address}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
