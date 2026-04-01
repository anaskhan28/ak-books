"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import PageHeader from "@/components/ui/page-header";
import type { Client } from "@/app/db/schema";

const workTypes = [
  "Branch Shifting",
  "Dismantling",
  "Locker Handling",
  "Scrap Disposal",
  "Interior Work",
  "Other",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await createProject({
      name: fd.get("name") as string,
      clientId: fd.get("clientId") ? Number(fd.get("clientId")) : null,
      workType: fd.get("workType") as string,
      startDate: (fd.get("startDate") as string) || null,
      status: "planning",
      description: (fd.get("description") as string) || null,
      location: (fd.get("location") as string) || null,
      quotedAmount: fd.get("quotedAmount") ? Number(fd.get("quotedAmount")) : 0,
    });
    router.push("/projects");
  }

  const fieldCls =
    "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-[14px] text-muted focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all";
  const labelCls = "block text-[13px] font-medium text-muted mb-1.5";

  return (
    <>
      <PageHeader title="New Project" subtitle="Create a new job entry" />
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-surface border border-border rounded-2xl p-6 space-y-5"
      >
        <div>
          <label className={labelCls}>Project Name *</label>
          <input
            name="name"
            required
            placeholder="e.g. Saraswat Bank Ghatkopar Branch Shifting"
            className={fieldCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Client</label>
            <select name="clientId" className={fieldCls}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Work Type *</label>
            <select name="workType" required className={fieldCls}>
              {workTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className={labelCls}>Start Date</label>
            <input name="startDate" type="date" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input
              name="location"
              placeholder="e.g. Ghatkopar East, Mumbai"
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>Quoted Amount (₹)</label>
            <input
              name="quotedAmount"
              type="number"
              min={0}
              placeholder="85000"
              className={fieldCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Brief details about the work..."
            className={fieldCls}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
