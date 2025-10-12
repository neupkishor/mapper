
import { MainLayout } from '@/components/layout/main-layout';
import { AISchemaForm } from '@/components/ai-schema-form';

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
          AI Schema Builder
        </h1>
        <div className="max-w-4xl">
          <p className="mb-8 text-muted-foreground">
            Describe your data and let our AI suggest the optimal schema for
            your database.
          </p>
          <AISchemaForm />
        </div>
      </div>
    </MainLayout>
  );
}
