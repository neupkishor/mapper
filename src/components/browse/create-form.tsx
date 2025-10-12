
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus2 } from 'lucide-react';
import { Database } from '@/lib/orm';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export function CreateForm() {
  const [collectionName, setCollectionName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateDocument = async () => {
    if (!collectionName) {
        toast({ variant: "destructive", title: "Collection name is missing." });
        return;
    }
    if (!newDocContent) {
        toast({ variant: "destructive", title: "Document content is missing." });
        return;
    }
    try {
        const docData = JSON.parse(newDocContent);
        setLoading(true);
        const newId = await Database.collection(collectionName).add(docData);
        toast({ title: "Document Created", description: `New document added with ID: ${newId}` });
        setNewDocContent('');
    } catch (e: any) {
        console.error("Create error:", e);
        toast({ variant: "destructive", title: "Failed to create document", description: e.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Document</CardTitle>
        <CardDescription>
          Enter a collection name and the JSON content for the new document.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="collection-name" className="text-sm font-medium">Collection Name</label>
          <Input
            id="collection-name"
            type="text"
            placeholder="e.g., users"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
            <label htmlFor="new-doc-content" className="text-sm font-medium">Document JSON</label>
            <Textarea
                id="new-doc-content"
                placeholder='{ "name": "John Doe", "age": 30 }'
                className="min-h-[200px] font-code"
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
            />
        </div>
        <Button onClick={handleCreateDocument} disabled={loading || !collectionName}>
          {loading ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
          <span>Create Document</span>
        </Button>
      </CardContent>
    </Card>
  );
}
