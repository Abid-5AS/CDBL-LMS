"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Key } from "lucide-react";
import Link from "next/link";

const WEBHOOK_EVENTS = [
  { value: "leave.submitted", label: "Leave Submitted", category: "Leave" },
  { value: "leave.approved", label: "Leave Approved", category: "Leave" },
  { value: "leave.rejected", label: "Leave Rejected", category: "Leave" },
  { value: "leave.cancelled", label: "Leave Cancelled", category: "Leave" },
  { value: "leave.updated", label: "Leave Updated", category: "Leave" },
  { value: "approval.pending", label: "Approval Pending", category: "Approval" },
  { value: "approval.completed", label: "Approval Completed", category: "Approval" },
  { value: "balance.updated", label: "Balance Updated", category: "Balance" },
  { value: "balance.low", label: "Balance Low", category: "Balance" },
  { value: "employee.created", label: "Employee Created", category: "Employee" },
  { value: "employee.updated", label: "Employee Updated", category: "Employee" },
  { value: "employee.deleted", label: "Employee Deleted", category: "Employee" },
  { value: "encashment.requested", label: "Encashment Requested", category: "Encashment" },
  { value: "encashment.approved", label: "Encashment Approved", category: "Encashment" },
  { value: "encashment.rejected", label: "Encashment Rejected", category: "Encashment" },
  { value: "encashment.paid", label: "Encashment Paid", category: "Encashment" },
];

export default function EditWebhookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
    description: "",
    enabled: true,
    secret: "",
  });

  useEffect(() => {
    fetchWebhook();
  }, [id]);

  const fetchWebhook = async () => {
    try {
      const res = await fetch(`/api/v1/webhooks/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch webhook");
      }
      const data = await res.json();
      setFormData({
        name: data.webhook.name,
        url: data.webhook.url,
        events: data.webhook.events,
        description: data.webhook.description || "",
        enabled: data.webhook.enabled,
        secret: data.webhook.secret || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.url.trim()) {
      setError("URL is required");
      return;
    }

    if (formData.events.length === 0) {
      setError("Please select at least one event");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          events: formData.events,
          description: formData.description,
          enabled: formData.enabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update webhook");
      }

      router.push(`/webhooks/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const selectAllInCategory = (category: string) => {
    const categoryEvents = WEBHOOK_EVENTS.filter((e) => e.category === category).map(
      (e) => e.value
    );
    const allSelected = categoryEvents.every((e) => formData.events.includes(e));

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        events: prev.events.filter((e) => !categoryEvents.includes(e)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        events: [...new Set([...prev.events, ...categoryEvents])],
      }));
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(formData.secret);
    alert("Secret copied to clipboard");
  };

  const categories = [...new Set(WEBHOOK_EVENTS.map((e) => e.category))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/webhooks/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Webhook Details
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Webhook</h1>
        <p className="text-sm text-gray-600 mt-1">Update webhook configuration</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enabled
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Disabled webhooks will not receive any events
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Signing Secret</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Use this secret to verify webhook signatures. Include it in your webhook
            handler to validate that requests are coming from this system.
          </p>
          <div className="flex gap-2">
            <input
              type={showSecret ? "text" : "password"}
              value={formData.secret}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              {showSecret ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={copySecret}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Event Subscriptions *
          </h2>

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {WEBHOOK_EVENTS.filter((e) => e.category === category).every(
                      (e) => formData.events.includes(e.value)
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.filter((e) => e.category === category).map(
                    (event) => (
                      <label
                        key={event.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {event.label}
                        </span>
                        <code className="text-xs text-gray-500 ml-auto">
                          {event.value}
                        </code>
                      </label>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/webhooks/${id}`}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
