
import { MainLayout } from '@/components/layout/main-layout';
import { SchemaBuilder } from '@/components/schemas/schema-builder';

export default function SchemasPage() {
  return (
    <MainLayout>
        <div className="space-y-8">
          <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
            Schema Builder
          </h1>
          <div className="max-w-4xl">
              <p className="mb-8 text-muted-foreground">
                Define the structure of your database collections. These schemas will be used in the Data Browser to provide a better experience for creating and editing documents.
              </p>
              <SchemaBuilder />
          </div>
        </div>
    </MainLayout>
  );
}
