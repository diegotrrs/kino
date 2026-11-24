import { BrowserContext, expect, test } from '@playwright/test';
import {
  createCalendar,
  createEvent,
  createTravelEvent,
  getCalendarId,
  getEventById,
  getToken,
  login,
  makeCalendarPublic,
  resetTestData,
} from './helpers/api';

const FLIGHT = { origin: 'LHR', destination: 'FCO', number: 'BA 2490', terminal: '5', gate: 'B32', seat: '14A' };
// The booking reference belongs to the event, not the ticket
const FLIGHT_REFERENCE = { booking_reference: 'K7XQ2M' };
const TRAIN = { origin: 'London St Pancras', destination: 'Paris Gare du Nord', coach: '7', seat: '61' };

// Local yyyy-MM-dd, matching the calendar grid's data-date attributes
const getToday = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Reading the system clipboard hangs in headless runs, so record what the app writes to it instead
const recordClipboard = async (context: BrowserContext): Promise<void> => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text: string) => { (window as unknown as { copied: string }).copied = text; } },
    });
  });
};

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@17. flight and train events', () => {
  test('@17.1 should add a flight with its ticket and show it in the timeline, the month view and the dialog', async ({
    page,
    request,
    context,
  }) => {
    await recordClipboard(context);
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Flight Test ${Date.now()}`);
    const title = `Rome weekend ${Date.now()}`;

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: 'Add Event' }).click();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByLabel('Event title').fill(title);
    await dialog.getByRole('group', { name: 'Travel' }).getByText('Flight', { exact: true }).click();
    for (const [label, value] of [
      ['From', 'LHR'], ['To', 'FCO'], ['Flight number', 'BA 2490'], ['Terminal', '5'],
      ['Gate', 'B32'], ['Seat', '14A'], ['Booking reference', 'K7XQ2M'],
    ]) {
      await dialog.getByLabel(label, { exact: true }).fill(value);
    }
    await dialog.getByRole('button', { name: 'Add Event' }).click();
    await expect(dialog).toBeHidden();

    // Month view: route instead of the title
    await page.reload();
    const cellEvent = page.locator(`td.fc-daygrid-day[data-date="${getToday()}"] .fc-event`).filter({ hasText: 'LHR → FCO' });
    await expect(cellEvent).toHaveCount(1);

    // Events timeline: the ticket strip
    await page.goto('/events');
    const strip = page.getByTestId('travel-strip').filter({ hasText: 'BA 2490' });
    await expect(strip).toContainText('LHR → FCO');
    await expect(strip).toContainText('GATEB32');
    await expect(strip).toContainText('SEAT14A');

    // Dialog: the boarding pass, and copying the reference
    await page.getByRole('button', { name: title, exact: true }).click();
    const card = page.getByRole('alertdialog').getByTestId('travel-card');
    await expect(card).toContainText('BA 2490');
    // Departure and arrival come from the event's own times (the add form's default 08:00–09:00)
    await expect(card).toContainText('08:00');
    await expect(card).toContainText('09:00');
    await card.getByRole('button', { name: 'Copy booking reference K7XQ2M' }).click();
    await expect(card).toContainText('Copied');
    expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe('K7XQ2M');
  });

  test('@17.2 should show a train with its icon, coach and seat', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Train Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createTravelEvent(request, token, calendarId, `Train to Paris ${Date.now()}`, getToday(), 'train', TRAIN);

    await page.goto(`/calendars/${calendarUuid}`);
    const cellEvent = page.locator(`td.fc-daygrid-day[data-date="${getToday()}"] .fc-event`)
      .filter({ hasText: 'London St Pancras → Paris Gare du Nord' });
    await expect(cellEvent.locator('.lucide-train-front')).toHaveCount(1);

    await page.goto('/events');
    const strip = page.getByTestId('travel-strip').filter({ hasText: 'Paris Gare du Nord' });
    await expect(strip.locator('.lucide-train-front')).toHaveCount(1);
    await expect(strip).toContainText('COACH7');
    await expect(strip).toContainText('SEAT61');
  });

  test('@17.3 should remove a flight\'s ticket when it is switched back to None', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Flight To None Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const title = `Cancelled flight ${Date.now()}`;
    const eventId = await createTravelEvent(request, token, calendarId, title, getToday(), 'flight', FLIGHT, FLIGHT_REFERENCE);

    await page.goto('/events');
    await page.getByRole('button', { name: title, exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('group', { name: 'Travel' }).getByText('None', { exact: true }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect.poll(async () => (await getEventById(request, token, eventId)).travel_mode).toBeNull();

    await page.reload();
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByRole('alertdialog').getByTestId('travel-card')).toHaveCount(0);
    expect((await getEventById(request, token, eventId)).travel).toBeNull();
  });

  test('@17.5 should show a public calendar\'s flight to visitors without its booking reference', async ({
    browser,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Public Flight Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createTravelEvent(request, token, calendarId, `Public flight ${Date.now()}`, getToday(), 'flight', FLIGHT, FLIGHT_REFERENCE);
    await makeCalendarPublic(request, token, calendarUuid);

    const visitor = await browser.newContext();
    try {
      const page = await visitor.newPage();
      await page.goto(`/calendars/${calendarUuid}`);
      await page.locator('.fc-event').filter({ hasText: 'LHR → FCO' }).click();
      const card = page.getByRole('alertdialog').getByTestId('travel-card');
      await expect(card).toContainText('14A');
      await expect(card).not.toContainText('K7XQ2M');
      await expect(card.getByRole('button')).toHaveCount(0);
    } finally {
      await visitor.close();
    }
  });

  test('@17.6 should show the boarding pass in the selected language', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Flight i18n Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createTravelEvent(request, token, calendarId, `Vuelo a Roma ${Date.now()}`, getToday(), 'flight', FLIGHT, FLIGHT_REFERENCE);
    await page.context().addCookies([{ name: 'locale', value: 'es', domain: 'localhost', path: '/' }]);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.locator('.fc-event').filter({ hasText: 'LHR → FCO' }).click();

    const card = page.getByRole('alertdialog').getByRole('region', { name: 'Billete de avión' });
    await expect(card).toContainText('Puerta');
    await expect(card.getByRole('button', { name: 'Copiar código de reserva K7XQ2M' })).toBeVisible();
  });

  test('@17.7 should suggest a flight\'s title and start the next event from a blank form', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Suggested Title Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createEvent(request, token, calendarId, 'Museum', getToday());

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: 'Add Event' }).click();
    let dialog = page.getByRole('alertdialog');
    await dialog.getByRole('group', { name: 'Travel' }).getByText('Flight', { exact: true }).click();
    await dialog.getByLabel('To', { exact: true }).fill('FCO');
    await expect(dialog.getByLabel('Event title')).toHaveValue('Flight to FCO');
    await dialog.getByRole('button', { name: 'Add Event' }).click();
    await expect(dialog).toBeHidden();

    // The header's Add Event opens a blank form, not the flight just added
    await page.getByRole('button', { name: 'Add Event' }).click();
    dialog = page.getByRole('alertdialog');
    await expect(dialog.getByLabel('Event title')).toHaveValue('');
    await expect(dialog.getByRole('group', { name: 'Travel' }).getByRole('radio', { name: 'None' })).toBeChecked();
    await dialog.getByRole('group', { name: 'Travel' }).getByText('Train', { exact: true }).click();
    await expect(dialog.getByLabel('To', { exact: true })).toHaveValue('');
  });
  test('@17.8 should link a flight to Flightradar24 from its boarding pass, even without a seat or reference', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Track Flight Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    // Only a number and a route: before, this flight's pass had no stub at all
    await createTravelEvent(
      request, token, calendarId, `Number-only flight ${Date.now()}`, getToday(), 'flight',
      { origin: 'LHR', destination: 'LIS', number: 'BA 500' },
    );
    await createTravelEvent(request, token, calendarId, `Train ${Date.now()}`, getToday(), 'train', TRAIN);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.locator('.fc-event').filter({ hasText: 'LHR → LIS' }).click();
    const track = page.getByRole('alertdialog').getByTestId('travel-card')
      .getByRole('link', { name: 'Track flight BA 500 on Flightradar24 (opens in a new tab)' });
    await expect(track).toBeVisible();
    await expect(track).toHaveAttribute('href', 'https://www.flightradar24.com/data/flights/ba500');
    await expect(track).toHaveAttribute('target', '_blank');

    await page.reload();
    await page.locator('.fc-event').filter({ hasText: 'London St Pancras → Paris Gare du Nord' }).click();
    await expect(page.getByRole('alertdialog').getByTestId('travel-card')).toBeVisible();
    await expect(page.getByRole('alertdialog').getByRole('link', { name: /Track flight/ })).toHaveCount(0);
  });
});

test.describe('@17. flight and train events on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('@17.4 should show a flight\'s ticket strip in the day sheet', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Phone Flight Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const title = `Phone flight ${Date.now()}`;
    await createTravelEvent(request, token, calendarId, title, getToday(), 'flight', FLIGHT, FLIGHT_REFERENCE);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.locator(`td.fc-daygrid-day[data-date="${getToday()}"]`).click();
    const sheet = page.getByRole('dialog');
    const strip = sheet.getByTestId('travel-strip');
    await expect(strip).toContainText('LHR → FCO');
    await expect(strip).toContainText('REFK7XQ2M');
    expect(await sheet.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);

    await sheet.getByRole('button', { name: title }).tap();
    await expect(page.getByRole('alertdialog').getByTestId('travel-card')).toBeVisible();
  });
  test('@17.9 should show Track flight under Copy reference on a phone', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Phone Track Flight ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const title = `Phone track ${Date.now()}`;
    await createTravelEvent(request, token, calendarId, title, getToday(), 'flight', FLIGHT, FLIGHT_REFERENCE);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.locator(`td.fc-daygrid-day[data-date="${getToday()}"]`).click();
    await page.getByRole('dialog').getByRole('button', { name: title }).tap();
    const card = page.getByRole('alertdialog').getByTestId('travel-card');
    const copy = card.getByRole('button', { name: 'Copy booking reference K7XQ2M' });
    const track = card.getByRole('link', { name: 'Track flight BA 2490 on Flightradar24 (opens in a new tab)' });
    await expect(track).toBeVisible();

    // Full width, at least 44 px tall, and below the Copy button
    const [copyBox, trackBox] = [await copy.boundingBox(), await track.boundingBox()];
    expect(trackBox?.height).toBeGreaterThanOrEqual(44);
    expect(trackBox?.width).toBeCloseTo(copyBox?.width ?? 0, 0);
    expect(trackBox?.y).toBeGreaterThan(copyBox?.y ?? 0);
  });
  test('@17.10 should make Track flight the coral button on a phone only when there is no Copy reference', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Phone Track Colour ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const withReference = `With reference ${Date.now()}`;
    const withoutReference = `Without reference ${Date.now()}`;
    await createTravelEvent(request, token, calendarId, withReference, getToday(), 'flight', FLIGHT, FLIGHT_REFERENCE);
    await createTravelEvent(request, token, calendarId, withoutReference, getToday(), 'flight', FLIGHT);
    const getBackground = async (title: string, role: 'button' | 'link', name: RegExp): Promise<string> => {
      await page.goto(`/calendars/${calendarUuid}`);
      await page.locator(`td.fc-daygrid-day[data-date="${getToday()}"]`).click();
      await page.getByRole('dialog').getByRole('button', { name: title }).tap();
      const control = page.getByRole('alertdialog').getByTestId('travel-card').getByRole(role, { name });
      return control.evaluate((el) => getComputedStyle(el).backgroundColor);
    };

    const coral = await getBackground(withReference, 'button', /^Copy booking reference/);
    const trackNextToCopy = await getBackground(withReference, 'link', /^Track flight/);
    const trackAlone = await getBackground(withoutReference, 'link', /^Track flight/);

    expect(trackAlone).toBe(coral);
    expect(trackNextToCopy).not.toBe(coral);
  });
});
