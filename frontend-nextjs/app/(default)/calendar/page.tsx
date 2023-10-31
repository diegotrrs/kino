export const metadata = {
  title: 'Calendar - Mosaic',
  description: 'Page description',
}

import { CalendarProvider } from './calendar-context'
import CalendarTable from './calendar-table'
import CalendarTitle from './title'

export default function Calendar() {

  return (
    <CalendarProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

        {/* Page header */}
        <div className="sm:flex sm:justify-between sm:items-center mb-4">

          {/* Left: Title */}
          <CalendarTitle />

          {/* Right: Actions */}
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
            <hr className="w-px h-full bg-slate-200 dark:bg-slate-700 border-none mx-1" />
          </div>
        </div>
        <CalendarTable />

      </div>
    </CalendarProvider>
  )
}