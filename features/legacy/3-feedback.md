# 1. Description

This feature will allow logged-in users to enter feedback of the app, and to vote for upcoming features.

# 2. Notes

## 2.1 Front end

In the top navigation bar, next to the three dots button there will be a new button (a megaphone) that will take the user to the new Feedback page. This page will have two sections:

- Feedback: that allows the user to enter their feedback (max 500 characters). The entered text should be checked (remove sql injection, or code and things like that). Once the user has entered the feedback, the textarea gets cleaned and a pop up appears that says "Feedback sent. Thank you".
- Vote for features (think of another name): will show a table with three columns: Name, Description, Vote. The vote should display a thumbs up unselected/selected if the user has voted for the feature.

## 2.2 Backend end

The backend and DB should to support storing the feedback (free text) and votes for the features. It should support adding a vote and removing a vote to a feature.

For now, you can include a list of dummy features (that might work for an app to create calendars to organise trips.)

# 3. Other
