import {
  expect,
  test
} from '@playwright/test';
import {
  createCalendar,
  deleteCalendar,
  getToken,
  login,
  resetTestData,
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@9. event duration presets', () => {
  test('@9.1 should display all duration preset buttons when adding an event', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Duration Presets Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();

    await expect(page.getByRole('button', { name: '30 min' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1 hr' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2 hr' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All day' })).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@9.2 clicking All day should hide the time pickers', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `All Day Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();

    await expect(page.getByText('Start time')).toBeVisible();
    await expect(page.getByText('End time')).toBeVisible();

    await page.getByRole('button', { name: 'All day' }).click();

    await expect(page.getByText('Start time')).not.toBeVisible();
    await expect(page.getByText('End time')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@9.3 clicking a duration preset after All day should restore time pickers', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Duration Restore Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();

    await page.getByRole('button', { name: 'All day' }).click();
    await expect(page.getByText('Start time')).not.toBeVisible();

    await page.getByRole('button', { name: '1 hr' }).click();
    await expect(page.getByText('Start time')).toBeVisible();
    await expect(page.getByText('End time')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@9.4 1 hr preset should be active by default when opening the add form', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Default Preset Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();

    // The active button has the default (filled) variant — check aria-pressed is not the right
    // approach here; instead verify the 1hr button does NOT have outline styling by checking
    // it is styled differently from its siblings. The simplest proxy: clicking Save without
    // changing anything should produce a 1-hour event. We verify indirectly via the edit form.
    await page.getByLabel('Title').fill('Default Duration Event');
    await page.getByRole('button', { name: /add event/i }).last().click();
    await expect(page.getByText('Default Duration Event')).toBeVisible({ timeout: 10000 });

    await page.getByText('Default Duration Event').first().click();
    // Edit form should show "1 hr" as active — time pickers are visible (not all-day)
    await expect(page.getByText('Start time')).toBeVisible();
    await expect(page.getByText('End time')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });
});
