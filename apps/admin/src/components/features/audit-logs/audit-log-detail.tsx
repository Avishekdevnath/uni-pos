interface AuditLogDetailProps {
  payload: Record<string, unknown>;
}

export function AuditLogDetail({ payload }: AuditLogDetailProps) {
  return (
    <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}
