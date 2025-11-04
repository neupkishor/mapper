
import { MainLayout } from '@/components/layout/main-layout';

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome
        </h1>
        <div className="max-w-4xl">
          <p className="mb-8 text-muted-foreground">
            AI features have been removed. Use the navigation to explore other sections.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
