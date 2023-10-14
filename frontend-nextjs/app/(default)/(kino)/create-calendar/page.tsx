
'use client'
import Datepicker from "@/components/datepicker"
import sdk from "@/lib/graphql/api"
import { faker } from "@faker-js/faker/locale/af_ZA"
import { FormEvent, useState } from "react"


 export default function CreateCalendar() {
  const [tripName, setTripName] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [startDate, setStartDate] = useState<string>()
  const [endDate, setEndDate] = useState<string>()


  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }

  const onCreateBtnClicked = () => {
    console.log('>>> on button clicked')
    sdk.createCalendar({
      input: {
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      }
    })
  }

  const onDatesChanged = (date1: Date, date2: Date) => {
    console.log('>>> onDatesChanged', date1, date2)
  }

  return (
    <div className="lg:relative lg:flex">

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 lg:grow lg:pr-8 xl:pr-16 2xl:ml-[80px]">
        <div className="lg:max-w-[640px] lg:mx-auto">

          {/* Cart items */}
          <div className="mb-6 lg:mb-0">           
            <header className="mb-6">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-2">Create a new calendar for your trip</h1>
              {/* <p>{faker.lorem.sentence(8)}</p> */}
            </header>
            {/* Billing Information */}
            <div>
              <div className="text-slate-800 dark:text-slate-100 font-semibold mb-4">Information</div>
              <form>
                <div className="space-y-4">
                  {/* 1st row */}
                  <div className="md:flex space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" htmlFor="card-name">
                        Name of your trip
                      </label>
                      <input id="card-name" className="form-input w-full" type="text" defaultValue="Family summer holiday" onChange={(e) => { setTripName(e.target.value) }}/>
                    </div>                    
                  </div>
                  <div className="md:flex space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" htmlFor="card-name">
                      Date Range
                      </label>
                      <Datepicker align="right" onDatesChanged={onDatesChanged} />
                    </div>                    
                  </div>                    
                  {/* 3rd row */}
                  <div className="md:flex space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1" htmlFor="card-state">
                        Place (e.g.: country or etc)
                      </label>
                      <input id="card-state" className="form-input w-full" type="text" defaultValue="Italy"  />
                    </div>
                 
                  </div>
                
                  <div className="text-right">
                    <button type="submit"
                      className="btn bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-indigo-500"
                      onClick={ () => { onCreateBtnClicked() } }
                      >
                      Create
                    </button>
                  </div>
                </div>
              </form>
            </div>           
          </div>
        </div>
      </div>
    </div>
  )
}
