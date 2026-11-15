# 1. Description

Now i want to start with something simple: I want to include in the home page, a section below favourites that include of Hot trips.
It will show a caroussel of cards, each card will include a title and a photo (thumbnail of the destination).
When click that card in the carousel, the user will be page to a page (MD file) that briefly talks about that destinatio. It will include a couple of photos, and a button in that new page that says "Plan your next trip to \_\_\_" that button will open the http://localhost:3000/calendars/create page for the user to create the calendar. As part of
this change you will need to change http://localhost:3000/calendars/create so it includes a new field called start date, this will be a new field in the calendar table that will dictacte when the trip will start and hence when the calendar should load.

# 2. Technical specification

## 2.1 Front end

- A caroussel needs to be aded in the Home page.
- Generate small page with a couple of pictures of the following trips:
  - Costa Rica: The Perfect 2-Week Adventure
  - Albania: Europe's Hidden Riviera
  - Uzbekistan: Journey Along the Silk Road
  - Wales: Castles, Coast & Mountains
  - Guatemala: Land of Volcanoes & Lakes
  - Thailand: Temples, Islands & Street Food
  - Japan: From Tokyo to Kyoto
  - Norway: Escape the Summer Heat

Each page will be contain static content (this dictates the render strategy for React/Next)

On the calendar page, then the calendar should load on the month of the startDate,

## 2.2 Backend end

A new field needs to be included. It will be startDate. This field would be mandatory. For existing calendars, this needs to be populated with the date of the first event.

# 3. Other
