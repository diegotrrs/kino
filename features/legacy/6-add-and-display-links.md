# 1. Description

- The user should be able to add one or more links to an event.

# 2. Technical specification

## 2.1 Front end

- The user should be able to add links to an event in the add event pop up (Edit Entry/Add Event). This can happen when creating a new event, or editing an event
- Under the current Description field a new section called Links should be availabile.
- This new section will display all existing links and a way to add a new link.
- Unit tests and e2e should be updated.
- For existing links, the title of the link (as saved in the DB) should be display along with the icon for link. When either is click the user should be taken to the website. The title of the link would only display a few characters (30) with ellipsis at the end

## 2.2 Backend end

The DB schema needs to be updated so an event can have one or several links. When a link is saved the backend should fetch the content, parse the html and retrieve the title.

# 3. Other

Make sure to include the following files in your context:

- frontend/CLAUDE.md.
- backend/CLAUDE.md
- ./CLAUDE.md
- backend/docs/coding-standards.md
- backend/docs/coding-standards.md
