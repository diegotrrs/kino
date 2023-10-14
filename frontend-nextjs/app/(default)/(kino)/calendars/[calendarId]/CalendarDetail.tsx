import Link from 'next/link'
import { CalendarProperties } from '../CalendarProperties'
import { Calendar } from '@/lib/graphql/generated'

type CalendarDetailProps = {
  calendar: Calendar
}

const CalendarDetailCard: React.FC<CalendarDetailProps> = ({ calendar }) => {
  const {
    typeColor,
    categoryIcon,
  } = CalendarProperties() 

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col h-full p-5">
        <header>
          <div className="flex items-center justify-between">
            {categoryIcon("1")}        
          </div>
        </header>
        <div className="grow mt-2">
          <Link className="inline-flex text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white mb-1" href={calendar.id}>
            <h2 className="text-xl leading-snug font-semibold">{calendar.name}</h2>
          </Link>
          <div className="text-sm">{calendar.name} {' - Detail'}</div>
        </div>
        <footer className="mt-5">
          <div className="text-sm font-medium text-slate-500 mb-2">{calendar.startDate} <span className="text-slate-400 dark:text-slate-600">-&gt;</span> {calendar.endDate}</div>
          <div className="flex justify-between items-center">
            <div>
              <div className={`text-xs inline-flex font-medium rounded-full text-center px-2.5 py-1 ${typeColor("One-Time")}`}>{"One-Time"}</div>
            </div>
            <div>
              <Link className="text-sm font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400" href={calendar.id}>View -&gt;</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default CalendarDetailCard