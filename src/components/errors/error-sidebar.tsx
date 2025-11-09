"use client";

import { useEffect, useState } from 'react';
import { getErrorLogs, clearErrorLogs, type ErrorLogEntry } from '@/app/errors/logger';
import { Button } from '@/components/ui/button';

export function ErrorSidebar() {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);

  const refresh = () => {
    try {
      setLogs(getErrorLogs());
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleClear = () => {
    clearErrorLogs();
    refresh();
  };

  const recent = logs.slice(-5).reverse();

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Errors</h3>
        <div className="flex gap-2 items-center">
          <span className="rounded bg-muted px-2 py-0.5 text-xs">{logs.length}</span>
          <Button variant="ghost" size="sm" onClick={refresh}>Refresh</Button>
          <Button variant="secondary" size="sm" onClick={handleClear}>Clear</Button>
        </div>
      </div>
      {recent.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No errors</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {recent.map((log) => (
            <li key={log.id} className="rounded border px-2 py-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                {log.route && <span className="text-[10px]">{log.route}</span>}
              </div>
              <div className="mt-1 text-xs line-clamp-2">
                <span className="font-medium">{log.name || 'Error'}:</span> {log.message}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

