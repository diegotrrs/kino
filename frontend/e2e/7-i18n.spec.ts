import {
  expect,
  test
}                from '@playwright/test';
import { format } from 'date-fns';
import { es }     from 'date-fns/locale';
import {
  createCalendar,
  createEvent,
  getCalendarId,
  getToken,
  login,
  resetTestData
}                from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@7. i18n', () => {
  test('@7.1 should switch language and persist the preference', async ({
    page,
  }) => {
    await page.goto('/settings');

    // Switch to Spanish
    await page.getByTestId('language-selector').getByRole('button', { name: 'Español' }).click();

    // Verify nav label changes to Spanish
    await expect(page.getByTestId('nav-home').first()).toContainText('Inicio');

    // Reload and verify preference is persisted
    await page.reload();
    await expect(page.getByTestId('nav-home').first()).toContainText('Inicio');

    // Switch back to English so other tests are not affected
    await page.goto('/settings');
    await page.getByTestId('language-selector').getByRole('button', { name: 'English' }).click();
  });

  test('@7.2 should show forms, dates, the calendar grid and tooltips in the selected language', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `i18n Grid Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const eventDate = '2035-06-04';
    await createEvent(request, token, calendarId, `Cena ${Date.now()}`, eventDate);
    // Cookie only, not the saved preference, so tests running in parallel stay in English
    await page.context().addCookies([{ name: 'locale', value: 'es', domain: 'localhost', path: '/' }]);

    // Create-calendar form
    await page.goto('/calendars/create');
    await expect(page.getByText('Nombre', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Mi calendario')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear' })).toBeVisible();

    // Calendar: weekday headers and the month picker
    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.locator('.fc-col-header')).toContainText(/lun/i);
    await expect(page.locator('.fc-col-header')).not.toContainText(/mon/i);
    const thisMonth = new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date());
    await expect(page.getByText(new RegExp(`^${thisMonth}$`, 'i')).first()).toBeVisible();

    // Events page: the date divider
    await page.goto('/events');
    const divider = format(new Date(2035, 5, 4), 'EEE d MMM yyyy', { locale: es });
    await expect(page.getByText(divider, { exact: false }).first()).toBeVisible();

    // Account tooltip / label and the feedback box
    await expect(page.getByRole('button', { name: 'Cuenta' }).first()).toBeAttached();
    await page.goto('/feedback');
    await expect(page.getByPlaceholder(/Comparte/)).toBeVisible();
  });

  test('@7.3 should show calendar actions, sharing, event toasts and calendar settings in the selected language', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const name = `Viaje ${Date.now()}`;
    const calendarUuid = await createCalendar(request, token, name);
    await page.context().addCookies([{ name: 'locale', value: 'es', domain: 'localhost', path: '/' }]);

    // Calendar page: header actions and the share dialog
    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByRole('link', { name: 'Volver' })).toBeVisible();
    await page.getByRole('button', { name: 'Compartir calendario' }).click();
    const shareDialog = page.getByRole('dialog');
    await expect(shareDialog.getByRole('heading', { name: `Compartir «${name}»` })).toBeVisible();
    await expect(shareDialog.getByText('Hazlo público para compartirlo')).toBeVisible();
    await expect(shareDialog.getByRole('button', { name: 'Copiar enlace' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Adding an event: the confirmation toast
    await page.getByRole('button', { name: /añadir evento/i }).first().click();
    const eventDialog = page.getByRole('alertdialog');
    await eventDialog.getByLabel('Título del evento').fill('Cena');
    await eventDialog.getByRole('button', { name: /añadir evento/i }).click();
    // Exact: Radix also renders a hidden "Notification …" announcement with the same words
    await expect(page.getByText('¡Evento añadido!', { exact: true })).toBeVisible();

    // Calendar settings page
    await page.goto(`/calendars/${calendarUuid}/edit`);
    await expect(page.getByRole('heading', { name: 'Editar calendario' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Miembros' })).toBeVisible();
    await expect(page.getByText('Eliminar este calendario')).toBeVisible();
  });
});
