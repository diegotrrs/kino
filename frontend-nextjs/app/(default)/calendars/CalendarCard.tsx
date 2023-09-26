import Link from 'next/link'
import { CalendarProperties } from './CalendarProperties'

type CalendarProps = {
  id: number
  category: string
  title: string
  link: string
  content: string
  dates: {
    from: string
    to: string
  }
  type: string
}

//export default function CalendarCard({ calendar}: { calendar: CalendarProps }) {
  export default function CalendarCard(props: any) {
  const {
    typeColor,
    categoryIcon,
  } = CalendarProperties() 

  const calendar = {
    id: 0,
    category: '1',      
    title: 'Monitor progress in Real Time Value',
    link: '#0',
    content: 'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.',
    dates: {
      from: 'Jan 20',
      to: 'Jan 27'
    },
    type: 'One-Time'
  }
  

  return (
    <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col h-full p-5">
        <header>
          <div className="flex items-center justify-between">
            {categoryIcon(calendar.category)}        
          </div>
        </header>
        <div className="grow mt-2">
          <Link className="inline-flex text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white mb-1" href={calendar.link}>
            <h2 className="text-xl leading-snug font-semibold">{calendar.title}</h2>
          </Link>
          <div className="text-sm">{calendar.content}</div>
        </div>
        <footer className="mt-5">
          <div className="text-sm font-medium text-slate-500 mb-2">{calendar.dates.from} <span className="text-slate-400 dark:text-slate-600">-&gt;</span> {calendar.dates.to}</div>
          <div className="flex justify-between items-center">
            <div>
              <div className={`text-xs inline-flex font-medium rounded-full text-center px-2.5 py-1 ${typeColor(calendar.type)}`}>{calendar.type}</div>
            </div>
            <div>
              <Link className="text-sm font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400" href={calendar.link}>View -&gt;</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
