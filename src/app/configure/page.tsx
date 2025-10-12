import { MainLayout } from '@/components/layout/main-layout';
import { ConfigureDBForm } from '@/components/configure-db-form';

export default function ConfigurePage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
          Database Configuration
        </h1>
        <div className="max-w-4xl">
            <p className="mb-8 text-muted-foreground">
              Configure the credentials for the database you want to connect to. This information will be stored securely in your browser's local storage and will not be transmitted elsewhere.
            </p>
            <ConfigureDBForm />
        </div>
      </div>
    </MainLayout>
  );
}
