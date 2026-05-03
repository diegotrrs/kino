# E2E Test Scenarios

## 1. Authentication

| # | Scenario |
|---|---|
| 1.1 | Landing page loads with hero text and sign-up CTA |
| 1.2 | Clicking "Get started free" on the landing page navigates to `/signup` |
| 1.3 | User can log in with valid credentials and is redirected to `/home` |
| 1.4 | User sees an error message when logging in with an incorrect password |
| 1.5 | User sees an error message when logging in with an email that does not exist |
| 1.6 | User can sign up with a new account and is redirected to `/home` |
| 1.7 | User sees field validation errors when submitting the sign-up form empty |
| 1.8 | User sees an error when signing up with an email that is already registered |
| 1.9 | Unauthenticated user is redirected to `/login` when accessing `/calendars` |
| 1.10 | User can log out and is redirected to the landing page |
| 1.11 | User can request a password reset and sees a confirmation message |

---

## 2. Calendars

| # | Scenario |
|---|---|
| 2.1 | Authenticated user can view the My Calendars page |
| 2.2 | User can create a new calendar and it appears in the list |
| 2.3 | User can open a calendar and see the calendar view |
| 2.4 | User can edit a calendar name and description |
| 2.5 | User can delete a calendar and it disappears from the list |
| 2.6 | User can mark a calendar as a favourite |
| 2.7 | Deleted calendar appears in Settings > Recover deleted calendars |
| 2.8 | User can restore a deleted calendar |
| 2.9 | A public calendar is accessible without authentication in read-only mode |
| 2.10 | Add event button is not shown in read-only mode |

---

## 3. Events

| # | Scenario |
|---|---|
| 3.1 | User can add a new event by clicking a day on the calendar |
| 3.2 | Newly created event appears on the correct day in the calendar |
| 3.3 | User can open an existing event and edit its title |
| 3.4 | User can change an event's colour |
| 3.5 | User can delete an event and it disappears from the calendar |

---

## 4. Sharing

| # | Scenario |
|---|---|
| 4.1 | User can open the share dialog for a calendar |
| 4.2 | Share buttons are disabled when the calendar is private |
| 4.3 | User can make a calendar public using the toggle in the share dialog |
| 4.4 | Share buttons become enabled after making the calendar public |
| 4.5 | User can copy the share link to the clipboard |
| 4.6 | User can invite another user as an editor by email |
| 4.7 | Invited editor appears in the members list |
| 4.8 | User can remove an editor and a confirmation dialog is shown |

---

## 5. Feedback

| # | Scenario |
|---|---|
| 5.1 | User can navigate to the Feedback page from the top bar |
| 5.2 | User can submit feedback and sees a success toast |
| 5.3 | Submit button is disabled when the feedback textarea is empty |
| 5.4 | User can vote on a wishlist item and the vote count increases |
| 5.5 | User can remove a vote and the vote count decreases |

---

## 6. Settings

| # | Scenario |
|---|---|
| 6.1 | User can navigate to Settings and see the Appearance section |
| 6.2 | User can switch to dark mode |
| 6.3 | User can navigate to Recover deleted calendars from Settings |
