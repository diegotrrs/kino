# 1. Description

Implement a way for users to view public calendars without the need to login or create an account. Private calendars will continue to be protected by authentication.

# 2. Notes

## 2.1 Front end

### 2.1.1 Accessing a Calendar.

a. If the calendar is public:

From the perspective of the owner of the calendar, they will be presented with a new share button. That button will present a typical Share dialog. This dialog will have options (Whatsapp, Facebook messenger, copy to clipboard (this option will be a button that after click an alert will shown saying (Now paste the url in an app))). If the calendar is private the options mentioned above will be disabled and on top of them a toggle will appear to make the calendar public, once it's been marked as public then options will become available, if the calendar is public then toggle button and the text will not appear. This share button will appear in:
• Calendar page: frontend/app/(app)/calendars/[id]/page.tsx, next to the edit (pencil button)
• My Calendars page: frontend/app/(app)/calendars/page.tsx. In the three dots button, above the delete button.
• Home page: frontend/app/(app)/home/page.tsx. In the three dots button, above the delete button.

From the perspective of the person the calendar was shared with when they access the calendar, if they are not logged in. The following changes in the UI will apply in the Calendar page:

- The Add event button should be disable.
- The favourite button should be disable.
- The edit calendar button is disable
- When an event is clicked, the edit dialog will pop up but the save and delete button
  • Left navigation bar: frontend/lib/nav.ts. All buttons should be disable
  • Top navigation bar: frontend/components/top-bar.tsx. All buttons should be disable

on Top of the navigation bar a top banner will appear:

A thin, non-intrusive bar at the top that says: “Viewing in read-only mode. Sign in to edit, save, or duplicate this trip.”

CTA buttons:
• “Sign in”
• “Create account”

If the person who opens the url (from whatsapp, browser, etc) is logged in then the Calendar page and the rest of the components should behave as of now (fully functional).

b. If the calendar is not public:

When a user accesses a private calendar via a shared link, the calendar content remains visible in the background but is visually de-emphasised with a blur or darkened overlay.

A centered modal (or prominent card) appears above the content stating that the calendar is private and cannot be viewed publicly.

The message clearly explains the state and provides a next action, such as:
• “Ask the owner to share access”
• “Request access” (optional if you support permissions)

The background remains visible but non-interactive, reinforcing that the content exists but is restricted.

### 2.1.2 Making a calendar public or private

In the Edit calendar page a new section (toggle) will appear to change the calendar's visibility.

## 2.2 Backend

- Extend the path calendar endpoint to change the visibility of a calendar.
- The get calendar endpoint to include the visibility of the calendar.

# 3. Other

Change the seed data so all calendars are private by default.
