import { BrowserContext, expect, test } from '@playwright/test';
import {
  createCalendar,
  createTravelEvent,
  getCalendarId,
  getEventById,
  getToken,
  login,
  makeCalendarPublic,
  resetTestData,
} from './helpers/api';

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

test.describe('@18. booking references on every event', () => {
  test('@18.1 should save a booking reference on an ordinary event and copy it from the events timeline', async ({
    page,
    request,
    context,
  }) => {
    await recordClipboard(context);
    await login(page);
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Reference Test ${Date.now()}`);
    const title = `Vatican Museums ${Date.now()}`;

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: 'Add Event' }).click();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByLabel('Event title').fill(title);
    await dialog.getByLabel('Booking reference', { exact: true }).fill('VM-2035');
    await dialog.getByRole('button', { name: 'Add Event' }).click();
    await expect(dialog).toBeHidden();

    await page.goto('/events');
    const chip = page.getByRole('button', { name: 'Copy booking reference VM-2035' });
    await expect(chip).toBeVisible();
    await chip.click();
    expect(await page.evaluate(() => (window as unknown as { copied: string }).copied)).toBe('VM-2035');

    // The form shows it again, and the event wasn't opened by tapping the chip
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByRole('alertdialog').getByLabel('Booking reference', { exact: true })).toHaveValue('VM-2035');
  });

  test('@18.2 should never show an ordinary event\'s booking reference to visitors of a public calendar', async ({
    browser,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Public Reference Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const title = `Colosseum ${Date.now()}`;
    const eventId = await createTravelEvent(request, token, calendarId, title, getToday(), null, null, {
      booking_reference: 'COL-777',
      location: 'Piazza del Colosseo, Roma',
    });
    await makeCalendarPublic(request, token, calendarUuid);
    expect((await getEventById(request, token, eventId)).booking_reference).toBe('COL-777');

    const visitor = await browser.newContext();
    try {
      const page = await visitor.newPage();
      await page.goto(`/calendars/${calendarUuid}`);
      await page.locator('.fc-event').filter({ hasText: title }).click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).not.toContainText('COL-777');
      await expect(dialog.getByLabel('Booking reference', { exact: true })).toHaveCount(0);
      expect(await page.content()).not.toContain('COL-777');
      // The address is public, and opens in Google Maps
      await expect(dialog.getByRole('link', { name: 'Open Piazza del Colosseo, Roma in Google Maps' })).toHaveAttribute(
        'href',
        'https://www.google.com/maps/search/?api=1&query=Piazza%20del%20Colosseo%2C%20Roma',
      );
    } finally {
      await visitor.close();
    }
  });

  test('@18.3 should show the recent colours on the same row as the theme colours', async ({ page, request }) => {
    await login(page);
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Colour Row Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createTravelEvent(request, token, calendarId, `Custom colour ${Date.now()}`, getToday(), null, null, {
      color: '#5DB7E8',
    });

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: 'Add Event' }).click();
    const dialog = page.getByRole('alertdialog');
    const palette = dialog.getByRole('radiogroup', { name: 'Theme colours' });
    const recent = dialog.getByRole('radiogroup', { name: 'Recent' });
    await expect(recent.getByRole('radio', { name: '#5DB7E8' })).toBeVisible();

    const paletteBox = await palette.boundingBox();
    const recentBox = await recent.boundingBox();
    expect(paletteBox && recentBox).toBeTruthy();
    // Same row: the recent swatches sit beside the palette, not under it
    expect(Math.abs((recentBox?.y ?? 0) - (paletteBox?.y ?? 0))).toBeLessThan(8);
    expect(recentBox?.x ?? 0).toBeGreaterThan(paletteBox?.x ?? 0);
  });

  test('@18.4 should save an address on an ordinary event and link it to Google Maps from the form and the timeline', async ({
    page,
    request,
  }) => {
    await login(page);
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Address Test ${Date.now()}`);
    const title = `Trattoria ${Date.now()}`;
    const address = 'Via della Lungaretta 92, Roma';
    const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Via%20della%20Lungaretta%2092%2C%20Roma';

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: 'Add Event' }).click();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByLabel('Event title').fill(title);
    await dialog.getByLabel('Address', { exact: true }).fill(address);
    const formLink = dialog.getByRole('link', { name: `Open ${address} in Google Maps` });
    await expect(formLink).toHaveAttribute('href', mapsUrl);
    await expect(formLink).toHaveAttribute('target', '_blank');
    await dialog.getByRole('button', { name: 'Add Event' }).click();
    await expect(dialog).toBeHidden();

    await page.goto('/events');
    const rowLink = page.getByRole('link', { name: `Open ${address} in Google Maps` });
    await expect(rowLink).toHaveAttribute('href', mapsUrl);
    await expect(rowLink).toHaveAttribute('rel', 'noopener noreferrer');
    // Nothing covers it: a tap reaches the map link, not the row's open-event layer
    await rowLink.click({ trial: true });

    await page.getByRole('button', { name: title, exact: true }).click();
    await expect(page.getByRole('alertdialog').getByLabel('Address', { exact: true })).toHaveValue(address);
  });
});

test.describe('@18. addresses on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('@18.5 should link an event\'s address to Google Maps in the day sheet', async ({ page, request }) => {
    await login(page);
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Phone Address Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createTravelEvent(request, token, calendarId, `Gelato ${Date.now()}`, getToday(), null, null, {
      location: 'Giolitti, Roma',
    });

    await page.goto(`/calendars/${calendarUuid}`);
    await page.locator(`td.fc-daygrid-day[data-date="${getToday()}"]`).click();
    const link = page.getByRole('dialog').getByRole('link', { name: 'Open Giolitti, Roma in Google Maps' });
    await expect(link).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=Giolitti%2C%20Roma');
    await link.click({ trial: true });
  });
});
