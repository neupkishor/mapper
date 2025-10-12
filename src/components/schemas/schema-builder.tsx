
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Save, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const fieldSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required.'),
  fieldType: z.enum(['string', 'number', 'boolean', 'array', 'object']),
});

const schemaFormSchema = z.object({
  collectionName: z.string().min(1, 'Collection name is required.'),
  fields: z.array(fieldSchema).min(1, 'At least one field is required.'),
});

type SchemaFormValues = z.infer<typeof schemaFormSchema>;

export function SchemaBuilder() {
  const [loading, setLoading] = useState(false);
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [schemas, setSchemas] = useState<Record<string, SchemaFormValues>>({});
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedDbConfig = localStorage.getItem('dbConfig');
      if (savedDbConfig) {
        setDbConfig(JSON.parse(savedDbConfig));
      }

      const savedSchemas = localStorage.getItem('collectionSchemas');
      if (savedSchemas) {
        setSchemas(JSON.parse(savedSchemas));
      }
    } catch (error) {
      console.error('Failed to load from local storage', error);
    }
  }, []);

  const form = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: {
      collectionName: '',
      fields: [{ fieldName: '', fieldType: 'string' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const onSubmit = (values: SchemaFormValues) => {
    setLoading(true);
    try {
      const newSchemas = { ...schemas, [values.collectionName]: values };
      localStorage.setItem('collectionSchemas', JSON.stringify(newSchemas));
      setSchemas(newSchemas);
      toast({
        title: 'Schema Saved',
        description: `Schema for "${values.collectionName}" has been saved locally.`,
      });
    } catch (error) {
      console.error('Error saving schema:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to save schema. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = (collectionName: string) => {
    const schema = schemas[collectionName];
    if (schema) {
      form.reset(schema);
    }
  };
  
  const deleteSchema = (collectionName: string) => {
    if (window.confirm(`Are you sure you want to delete the schema for "${collectionName}"?`)) {
      const newSchemas = { ...schemas };
      delete newSchemas[collectionName];
      localStorage.setItem('collectionSchemas', JSON.stringify(newSchemas));
      setSchemas(newSchemas);
      form.reset({
        collectionName: '',
        fields: [{ fieldName: '', fieldType: 'string' }],
      });
      toast({
        title: 'Schema Deleted',
        description: `Schema for "${collectionName}" has been deleted.`,
      });
    }
  };

  return (
    <div className="space-y-8">
      {!dbConfig && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Not Configured</AlertTitle>
          <AlertDescription>
            Please go to the <a href="/configure" className="font-bold underline">Configure</a> page to set up your database connection first.
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(schemas).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Schemas</CardTitle>
            <CardDescription>Load or delete an existing schema.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.keys(schemas).map(name => (
                <div key={name} className="flex items-center gap-1 rounded-full border bg-muted/50 pl-3">
                    <span className="text-sm font-medium">{name}</span>
                    <Button variant="ghost" size="sm" onClick={() => loadSchema(name)}>Load</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSchema(name)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Define a Schema</CardTitle>
          <CardDescription>
            Specify the collection name and its fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="collectionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., users, products" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Fields</FormLabel>
                <div className="space-y-4 pt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-wrap items-start gap-2 rounded-lg border p-3">
                      <FormField
                        control={form.control}
                        name={`fields.${index}.fieldName`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Field Name" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`fields.${index}.fieldType`}
                        render={({ field }) => (
                          <FormItem className="w-full sm:w-48">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="array">Array</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ fieldName: '', fieldType: 'string' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={loading || !dbConfig} className="w-full sm:w-auto">
                {loading ? <Loader2 className="animate-spin" /> : <Save />}
                <span>{loading ? 'Saving...' : 'Save Schema'}</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
