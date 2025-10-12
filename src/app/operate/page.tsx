import { MainLayout } from '@/components/layout/main-layout';
import { AIOperationForm } from '@/components/ai-operation-form';

export default function OperatePage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
          AI Operation Builder
        </h1>
        <div className="max-w-4xl">
          <p className="mb-8 text-muted-foreground">
            Describe the database operation you want to perform, and the AI
            will generate the code for you.
          </p>
          <AIOperationForm />
        </div>
      </div>
    </MainLayout>
  );
}
