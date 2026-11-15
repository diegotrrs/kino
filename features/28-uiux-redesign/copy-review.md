# 28 — Copy review (Phase 6)

New tone: short, warm, a little playful. Errors still say what went wrong and what to do. No jokes on destructive actions.

Today every toast is hard-coded in English. They move to a new `toasts` namespace in all four locale files, so they get translated for the first time.

Edit anything you'd like changed directly in this file, then tell me to apply it.

---

## 1. Success toasts

| Key | Today | en | es | pt | de |
|---|---|---|---|---|---|
| `calendarCreated` | Calendar created! | Wheels up. Your calendar is ready. | Listo para despegar. Tu calendario está creado. | Pronto para partir. O teu calendário está criado. | Bereit zum Abflug. Dein Kalender ist fertig. |
| `calendarCreatedFromTrip` | Calendar created with your itinerary! | Itinerary loaded. Your days are mapped out. | Itinerario cargado. Tus días ya tienen plan. | Itinerário carregado. Os teus dias já têm plano. | Reiseroute geladen. Deine Tage sind geplant. |
| `calendarUpdated` | Calendar updated! | Saved. | Guardado. | Guardado. | Gespeichert. |
| `calendarPublic` | Calendar is now public | Calendar is public. Anyone with the link can view it. | El calendario es público. Cualquiera con el enlace puede verlo. | O calendário é público. Qualquer pessoa com o link pode vê-lo. | Der Kalender ist öffentlich. Alle mit dem Link können ihn sehen. |
| `calendarPrivate` | Calendar is now private | Calendar is private. Only members can see it. | El calendario es privado. Solo los miembros pueden verlo. | O calendário é privado. Só os membros podem vê-lo. | Der Kalender ist privat. Nur Mitglieder können ihn sehen. |
| `calendarDeleted` | Calendar deleted | Calendar deleted. You can restore it from Settings. | Calendario eliminado. Puedes recuperarlo desde Ajustes. | Calendário eliminado. Podes recuperá-lo nas Definições. | Kalender gelöscht. Du kannst ihn in den Einstellungen wiederherstellen. |
| `calendarRestored` | Calendar restored | Welcome back. Calendar restored. | Ha vuelto. Calendario recuperado. | Está de volta. Calendário recuperado. | Willkommen zurück. Kalender wiederhergestellt. |
| `inviteSent` | An email has been sent to {email} | Invite sent to {email}. | Invitación enviada a {email}. | Convite enviado para {email}. | Einladung an {email} gesendet. |
| `memberRemoved` | Member removed. | Member removed. | Miembro eliminado. | Membro removido. | Mitglied entfernt. |
| `eventAdded` | Event added! / Event created! | Added to the plan. | Añadido al plan. | Adicionado ao plano. | Zum Plan hinzugefügt. |
| `eventUpdated` | Event edited! | Event updated. | Evento actualizado. | Evento atualizado. | Termin aktualisiert. |
| `eventDeleted` | Event deleted! | Event deleted. | Evento eliminado. | Evento eliminado. | Termin gelöscht. |
| `feedbackSent` | Feedback sent. Thank you! | Thanks! Your feedback is on its way. | ¡Gracias! Tu comentario va de camino. | Obrigado! O teu comentário está a caminho. | Danke! Dein Feedback ist unterwegs. |

## 2. Error toasts

All errors follow the pattern "Couldn't X. Try again." Usually the only fix available to the user is retrying, so the message says so plainly.

| Key | Today | en | es | pt | de |
|---|---|---|---|---|---|
| `eventSaveFailed` | Failed to save event | Couldn't save the event. Try again. | No se pudo guardar el evento. Inténtalo de nuevo. | Não foi possível guardar o evento. Tenta outra vez. | Termin konnte nicht gespeichert werden. Versuch es nochmal. |
| `eventAddFailed` | Failed to add / create event | Couldn't add the event. Try again. | No se pudo añadir el evento. Inténtalo de nuevo. | Não foi possível adicionar o evento. Tenta outra vez. | Termin konnte nicht hinzugefügt werden. Versuch es nochmal. |
| `eventDeleteFailed` | Failed to delete event | Couldn't delete the event. Try again. | No se pudo eliminar el evento. Inténtalo de nuevo. | Não foi possível eliminar o evento. Tenta outra vez. | Termin konnte nicht gelöscht werden. Versuch es nochmal. |
| `calendarCreateFailed` | Failed to create calendar | Couldn't create the calendar. Try again. | No se pudo crear el calendario. Inténtalo de nuevo. | Não foi possível criar o calendário. Tenta outra vez. | Kalender konnte nicht erstellt werden. Versuch es nochmal. |
| `calendarUpdateFailed` | Failed to update calendar | Couldn't save your changes. Try again. | No se pudieron guardar los cambios. Inténtalo de nuevo. | Não foi possível guardar as alterações. Tenta outra vez. | Änderungen konnten nicht gespeichert werden. Versuch es nochmal. |
| `calendarDeleteFailed` | Failed to delete calendar | Couldn't delete the calendar. Try again. | No se pudo eliminar el calendario. Inténtalo de nuevo. | Não foi possível eliminar o calendário. Tenta outra vez. | Kalender konnte nicht gelöscht werden. Versuch es nochmal. |
| `calendarRestoreFailed` | Failed to restore calendar | Couldn't restore the calendar. Try again. | No se pudo recuperar el calendario. Inténtalo de nuevo. | Não foi possível recuperar o calendário. Tenta outra vez. | Kalender konnte nicht wiederhergestellt werden. Versuch es nochmal. |
| `visibilityFailed` | Failed to update visibility | Couldn't change who can see this calendar. Try again. | No se pudo cambiar quién ve este calendario. Inténtalo de nuevo. | Não foi possível mudar quem vê este calendário. Tenta outra vez. | Sichtbarkeit konnte nicht geändert werden. Versuch es nochmal. |
| `favouriteFailed` | Failed to update favourite | Couldn't update your favourites. Try again. | No se pudieron actualizar tus favoritos. Inténtalo de nuevo. | Não foi possível atualizar os teus favoritos. Tenta outra vez. | Favoriten konnten nicht aktualisiert werden. Versuch es nochmal. |
| `inviteFailed` (title) | Failed to invite user | That invite didn't land. | La invitación no ha llegado. | O convite não chegou. | Die Einladung ist nicht angekommen. |
| `inviteFailedHint` (description) | Make sure the email is registered… | Check the email belongs to a Kino account that isn't already a member. | Comprueba que el email tiene cuenta en Kino y que no es ya miembro. | Confirma que o email tem conta no Kino e que ainda não é membro. | Prüfe, ob die E-Mail zu einem Kino-Konto gehört, das noch kein Mitglied ist. |
| `memberRemoveFailed` | Failed to remove member | Couldn't remove the member. Try again. | No se pudo eliminar al miembro. Inténtalo de nuevo. | Não foi possível remover o membro. Tenta outra vez. | Mitglied konnte nicht entfernt werden. Versuch es nochmal. |
| `feedbackFailed` | Failed to send feedback… | Couldn't send your feedback. Try again. | No se pudo enviar tu comentario. Inténtalo de nuevo. | Não foi possível enviar o teu comentário. Tenta outra vez. | Feedback konnte nicht gesendet werden. Versuch es nochmal. |
| `voteFailed` | Failed to update vote | Couldn't save your vote. Try again. | No se pudo guardar tu voto. Inténtalo de nuevo. | Não foi possível guardar o teu voto. Tenta outra vez. | Deine Stimme konnte nicht gespeichert werden. Versuch es nochmal. |

## 3. Empty states and small labels

| Key | Today | en | es | pt | de |
|---|---|---|---|---|---|
| `events.empty` | No events yet | Nothing planned yet. | Aún no hay nada planeado. | Ainda não há nada planeado. | Noch nichts geplant. |
| `events.emptyHint` | Create your first event to get started. | Add your first event and the trip starts taking shape. | Añade tu primer evento y el viaje empezará a tomar forma. | Adiciona o teu primeiro evento e a viagem começa a ganhar forma. | Füge deinen ersten Termin hinzu, dann nimmt die Reise Gestalt an. |
| `home.noFavourites` | No favourites yet | No favourites yet. | Aún no hay favoritos. | Ainda sem favoritos. | Noch keine Favoriten. |
| `deletedCalendars.empty` | No deleted calendars. | Nothing in here. Every trip is still on. | Aquí no hay nada. Todos los viajes siguen en pie. | Nada por aqui. Todas as viagens continuam de pé. | Hier ist nichts. Alle Reisen finden noch statt. |
| `eventCosts.noGeneralExpenses` | No general expenses yet. | No shared expenses yet. | Aún no hay gastos compartidos. | Ainda sem despesas partilhadas. | Noch keine gemeinsamen Ausgaben. |
| `notFound.title` (new 404 page) | Default Next.js 404 | Wrong gate. | Puerta equivocada. | Porta de embarque errada. | Falsches Gate. |
| `notFound.body` (new) | — | We couldn't find that page. Head back home and pick up where you left off. | No encontramos esa página. Vuelve al inicio y sigue donde lo dejaste. | Não encontrámos essa página. Volta ao início e continua onde ficaste. | Diese Seite gibt es nicht. Geh zurück zur Startseite und mach dort weiter. |
| `notFound.cta` (new) | — | Back to home | Volver al inicio | Voltar ao início | Zur Startseite |

Already written during Phases 2–5, for review too: `tripPass.*`, `calendarList.*`, `postcard.*` and `eventColors.*` in `messages/*.json`.

## 4. Not changed

- **Login and signup errors**, such as "Invalid email or password". These come from the backend, and the e2e tests assert on them.
- **The event dialog's other labels** ("Colour", "Change date and time", and the rest). They're English-only today; translating them is a separate i18n task, not a tone change.

## 5. Tests affected

`e2e/12-events.spec.ts` asserts "Create your first event to get started." It will be updated together with `events.emptyHint`.
