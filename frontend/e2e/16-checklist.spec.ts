import { expect, test } from '@playwright/test';
import {
  createCalendar,
  createChecklistItem,
  getChecklistTexts,
  getToken,
  login,
  makeCalendarPublic,
  resetTestData,
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@16. trip checklist', () => {
  test('@16.1 should add, tick, edit and delete checklist items on desktop and keep them after a reload', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Checklist Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    const panel = page.getByTestId('checklist-panel');
    await expect(panel.getByText('Nothing on the list yet.')).toBeVisible();

    const addField = panel.getByLabel('Add to checklist');
    for (const text of ['Buy travel insurance', 'Book airport transfer', 'Renew pasport']) {
      await addField.fill(text);
      await addField.press('Enter');
    }
    await expect(addField).toBeFocused();
    await expect(panel.getByTestId('checklist-item')).toHaveText(['Buy travel insurance', 'Book airport transfer', 'Renew pasport']);
    await expect.poll(() => getChecklistTexts(request, token, calendarUuid)).toHaveLength(3);

    await panel.getByRole('checkbox', { name: 'Mark “Buy travel insurance” as done' }).check();
    await expect(panel.getByTestId('checklist-progress')).toHaveText('1 / 3');

    await panel.getByRole('button', { name: 'Edit “Renew pasport”' }).click();
    await panel.getByLabel('Item text').fill('Renew passport');
    await panel.getByLabel('Item text').press('Enter');

    const bookRow = panel.getByTestId('checklist-item').filter({ hasText: 'Book airport transfer' });
    await bookRow.hover();
    await bookRow.getByRole('button', { name: 'Delete “Book airport transfer”' }).click();

    await expect.poll(() => getChecklistTexts(request, token, calendarUuid))
      .toEqual(['✓ Buy travel insurance', 'Renew passport']);

    await page.reload();
    const reloaded = page.getByTestId('checklist-panel');
    await expect(reloaded.getByTestId('checklist-item')).toHaveText(['Buy travel insurance', 'Renew passport']);
    await expect(reloaded.getByRole('checkbox', { name: 'Mark “Buy travel insurance” as done' })).toBeChecked();
    await expect(reloaded.getByTestId('checklist-progress')).toHaveText('1 / 2');
  });

  test('@16.2 should reorder checklist items with the keyboard and keep the new order after a reload', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Checklist Reorder Test ${Date.now()}`);
    for (const text of ['Buy travel insurance', 'Book airport transfer', 'Renew passport']) {
      await createChecklistItem(request, token, calendarUuid, text);
    }

    await page.goto(`/calendars/${calendarUuid}`);
    const panel = page.getByTestId('checklist-panel');
    await panel.getByRole('button', { name: 'Move “Renew passport”' }).focus();
    // dnd-kit measures the list after pick-up, so pause like a person would between keys
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');

    await expect(panel.getByTestId('checklist-item')).toHaveText(['Renew passport', 'Buy travel insurance', 'Book airport transfer']);
    await expect.poll(() => getChecklistTexts(request, token, calendarUuid))
      .toEqual(['Renew passport', 'Buy travel insurance', 'Book airport transfer']);

    await page.reload();
    await expect(page.getByTestId('checklist-panel').getByTestId('checklist-item'))
      .toHaveText(['Renew passport', 'Buy travel insurance', 'Book airport transfer']);
  });

  test('@16.3 should hide the checklist from visitors of a public calendar', async ({ browser, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Checklist Public Test ${Date.now()}`);
    await createChecklistItem(request, token, calendarUuid, 'Renew passport');
    await makeCalendarPublic(request, token, calendarUuid);

    const visitor = await browser.newContext();
    try {
      const page = await visitor.newPage();
      await page.goto(`/calendars/${calendarUuid}`);
      await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(page.getByTestId('checklist-panel')).toHaveCount(0);
      await expect(page.getByText('Renew passport')).toHaveCount(0);
    } finally {
      await visitor.close();
    }
  });

  test('@16.4 should show the checklist in the selected language', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Checklist i18n Test ${Date.now()}`);
    await page.context().addCookies([{ name: 'locale', value: 'es', domain: 'localhost', path: '/' }]);

    await page.goto(`/calendars/${calendarUuid}`);

    const panel = page.getByTestId('checklist-panel');
    await expect(panel.getByText('Lista de tareas')).toBeVisible();
    await expect(panel.getByText('Todavía no hay nada en la lista.')).toBeVisible();
    await expect(panel.getByPlaceholder('Añade algo por hacer…')).toBeVisible();
  });
});

test.describe('@16. trip checklist on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('@16.5 should use the checklist through the chip and drawer on phones', async ({ page, request }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Checklist Phone Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByTestId('checklist-panel')).toBeHidden();
    await page.getByTestId('checklist-chip').tap();

    const drawer = page.getByRole('dialog', { name: 'Checklist' });
    const addField = drawer.getByLabel('Add to checklist');
    await expect(addField).toBeFocused();
    for (const text of ['Buy travel insurance', 'Book airport transfer']) {
      await addField.fill(text);
      await addField.press('Enter');
    }
    await drawer.getByRole('checkbox', { name: 'Mark “Buy travel insurance” as done' }).tap();
    await drawer.getByRole('button', { name: 'Delete “Book airport transfer”' }).tap();
    await expect(drawer.getByTestId('checklist-item')).toHaveText(['Buy travel insurance']);

    await drawer.getByRole('button', { name: 'Close checklist' }).tap();
    await expect(drawer).toBeHidden();
    await expect(page.getByTestId('checklist-chip')).toContainText('1/1');
    await expect.poll(() => getChecklistTexts(request, token, calendarUuid)).toEqual(['✓ Buy travel insurance']);

    await page.reload();
    await page.getByTestId('checklist-chip').tap();
    await expect(page.getByRole('dialog', { name: 'Checklist' }).getByTestId('checklist-item')).toHaveText(['Buy travel insurance']);
  });
});
