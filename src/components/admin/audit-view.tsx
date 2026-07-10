"use client";

import { useState } from "react";
import { ShieldAlert, Search } from "lucide-react";
import { SectionTitle, Card, Input, Badge } from "@/components/ui";
import { relativeTime } from "@/lib/utils";
import type { AuditLog } from "@/db/schema";

export function AuditView({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("");

  const filtered = logs.filter((log) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entityType?.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in">
      <SectionTitle
        title="Audit Logs"
        subtitle="System activity and mutation tracing for compliance and debugging."
      />

      <Card className="p-1">
        <div className="flex items-center gap-3 p-3">
          <Search className="h-5 w-5 text-muted ml-2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity, or details..."
            className="border-none shadow-none focus-visible:ring-0 bg-transparent px-0"
          />
        </div>

        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="px-5 py-3 font-semibold text-content">Timestamp</th>
                <th className="px-5 py-3 font-semibold text-content">Action</th>
                <th className="px-5 py-3 font-semibold text-content">Entity</th>
                <th className="px-5 py-3 font-semibold text-content">Details</th>
                <th className="px-5 py-3 font-semibold text-content text-right">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    <ShieldAlert className="mx-auto mb-3 h-8 w-8 opacity-20" />
                    No audit logs match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="px-5 py-3 text-subtle whitespace-nowrap">
                      {relativeTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="neutral" className="font-mono text-[10px] uppercase tracking-wider">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {log.entityType ? (
                        <span className="font-medium text-content">{log.entityType}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                      {log.entityId && <span className="ml-2 text-xs text-muted">#{log.entityId}</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-subtle max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={log.actor === "system" ? "neutral" : "brand"} className="capitalize">
                        {log.actor}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
