export const metadata = {
  title: 'Calendar detail page',
  description: 'This page shows the details of a Calendar.',
}

import CalendarDetail from './CalendarDetail'
import api from '@/lib/graphql/api'

type CalendarDetailPageProps = {
  params: {
    calendarId: string,
  }
}

const CalendarDetailPage : React.FC<CalendarDetailPageProps> = async ({ params: { calendarId } }) => {
  const response = await api.getCalendarById({ calendarId });
  const calendar = response.getCalendarById
 
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">

        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">My Kino Calendars - Detail</h1>
        </div>       
      </div>

        {calendar ? (
          <CalendarDetail key={calendar.id} calendar={calendar} />
        ) : (
          <p>No calendar found.</p>
        )}
    </div>
  )
}

export default CalendarDetailPage