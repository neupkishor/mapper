
'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { GetForm } from '@/components/browse/get-form';
import { CreateForm } from '@/components/browse/create-form';
import { UpdateForm } from '@/components/browse/update-form';
import { DeleteForm } from '@/components/browse/delete-form';
import { Database, FilePlus2, Pencil, Trash2 } from 'lucide-react';


type Operation = 'get' | 'create' | 'update' | 'delete';

export default function BrowsePage() {
  const [operation, setOperation] = useState<Operation>('get');

  const renderForm = () => {
    switch (operation) {
      case 'get':
        return <GetForm />;
      case 'create':
        return <CreateForm />;
      case 'update':
        return <UpdateForm />;
      case 'delete':
        return <DeleteForm />;
      default:
        return <GetForm />;
    }
  }

  const operationOptions = [
    { value: 'get', label: 'Get Documents', icon: <Database /> },
    { value: 'create', label: 'Create Document', icon: <FilePlus2 /> },
    { value: 'update', label: 'Update Document', icon: <Pencil /> },
    { value: 'delete', label: 'Delete Document', icon: <Trash2 /> },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
          Data Browser
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Select an Operation</CardTitle>
            <CardDescription>
              Choose the database operation you want to perform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={operation}
              onValueChange={(value: Operation) => setOperation(value)}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            >
              {operationOptions.map(({ value, label, icon }) => (
                <Label key={value} htmlFor={`op-${value}`} className="cursor-pointer">
                  <div className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors hover:bg-accent hover:text-accent-foreground ${operation === value ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                    {icon}
                    <span className="mt-2 font-medium">{label}</span>
                    <RadioGroupItem value={value} id={`op-${value}`} className="sr-only" />
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {renderForm()}
        
      </div>
    </MainLayout>
  );
}
