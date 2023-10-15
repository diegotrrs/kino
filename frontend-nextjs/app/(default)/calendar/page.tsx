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

        {/* Filters and view buttons */}
        <div className="sm:flex sm:justify-between sm:items-center mb-4">

          {/* Filters  */}
          {/* <div className="mb-4 sm:mb-0 mr-2">
            <ul className="flex flex-wrap items-center -m-1">
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400">
                  <div className="w-1 h-3.5 bg-sky-500 shrink-0"></div>
                  <span className="ml-1.5">Acme Inc.</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400">
                  <div className="w-1 h-3.5 bg-emerald-500 shrink-0"></div>
                  <span className="ml-1.5">Life & Family</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400">
                  <div className="w-1 h-3.5 bg-indigo-500 shrink-0"></div>
                  <span className="ml-1.5">Reservations</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400">
                  <div className="w-1 h-3.5 bg-rose-400 shrink-0"></div>
                  <span className="ml-1.5">Events</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400">
                  <div className="w-1 h-3.5 bg-amber-500 shrink-0"></div>
                  <span className="ml-1.5">Misc</span>
                </button>
              </li>
              <li className="m-1">
                <button className="btn-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-indigo-500">+Add New</button>
              </li>
            </ul>
          </div> */}
         
        </div>

        <CalendarTable />

      </div>
    </CalendarProvider>
  )
}