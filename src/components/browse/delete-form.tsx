
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { Database } from '@/lib/orm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DeleteForm() {
  const [collectionName, setCollectionName] = useState('');
  const [docId, setDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeleteDocument = async () => {
    if (!collectionName || !docId) {
        toast({ variant: "destructive", title: "Collection name and Document ID are required." });
        return;
    }
    setLoading(true);
    try {
        await Database.collection(collectionName).delete(docId);
        toast({ title: "Document Deleted", description: "The document has been deleted successfully." });
        setDocId('');
    } catch (e: any) {
        console.error("Delete error:", e);
        toast({ variant: "destructive", title: "Failed to delete document", description: e.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete a Document</CardTitle>
        <CardDescription>
          Provide the collection name and the ID of the document you want to delete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
                <label htmlFor="delete-collection-name" className="text-sm font-medium">Collection Name</label>
                <Input
                    id="delete-collection-name"
                    placeholder="e.g., users"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                />
            </div>
            <div className="flex flex-col space-y-2">
                <label htmlFor="delete-doc-id" className="text-sm font-medium">Document ID</label>
                <Input
                    id="delete-doc-id"
                    placeholder="Document ID to delete"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                />
            </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading || !collectionName || !docId}>
                <Trash2 />
                <span>Delete Document</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the document
                with ID <span className="font-bold font-mono">{docId}</span> from the '{collectionName}' collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDocument} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
