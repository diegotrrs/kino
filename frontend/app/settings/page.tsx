import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              Settings
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              Configure your preferences.
            </p>
          </div>

          <Separator />

          <p className='text-muted-foreground'>Nothing to configure yet.</p>
        </div>
      </div>
    </div>
  );
}
