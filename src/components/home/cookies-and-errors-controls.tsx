"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteCookie, getCookieNamesByPrefix, SCHEMA_COOKIE_KEY, CONFIG_COOKIE_PREFIX } from '@/lib/client-cookies';
import { clearErrorLogs } from '@/app/errors/logger';

export default function CookiesAndErrorsControls() {
  const { toast } = useToast();

  const clearSavedData = () => {
    try {
      // Delete all mapper config cookies
      const names = getCookieNamesByPrefix(CONFIG_COOKIE_PREFIX);
      names.forEach(n => deleteCookie(n));
      // Delete schema cookie
      deleteCookie(SCHEMA_COOKIE_KEY);
      toast({ title: 'Saved data cleared', description: 'Deleted config and schema cookies.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to clear saved data', description: e?.message || 'Unexpected error.' });
    }
  };

  const clearErrors = () => {
    try {
      clearErrorLogs();
      toast({ title: 'Error logs cleared', description: 'Local storage error logs removed.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to clear error logs', description: e?.message || 'Unexpected error.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Controls</CardTitle>
        <CardDescription>Manage cookies and error logs stored in your browser.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="destructive" onClick={clearSavedData}>Clear Saved Data (Cookies)</Button>
          <Button variant="secondary" onClick={clearErrors}>Clear Error Logs (Local Storage)</Button>
        </div>
      </CardContent>
    </Card>
  );
}

