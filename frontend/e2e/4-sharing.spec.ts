import {
  expect,
  test
} from '@playwright/test';
import {
  createCalendar,
  createTestUser,
  deleteUserById,
  getToken,
  inviteMember,
  login,
  makeCalendarPublic,
  resetTestData
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@4. sharing', () => {
  test('@4.1 should open the share dialog for a calendar', async ({
    page,
    request,
  }) => {
    const name = `Share Dialog ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto(`/calendars/${uuid}`);
    await page.getByRole('button', { name: /share calendar/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('@4.2 share buttons should be disabled when the calendar is private', async ({
    page,
    request,
  }) => {
    const name = `Private Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto(`/calendars/${uuid}`);
    await page.getByRole('button', { name: /share calendar/i }).click();
    await expect(
      page.getByRole('button', { name: /whatsapp/i })
    ).toBeDisabled();
  });

  test('@4.3 should make a calendar public using the toggle in the share dialog', async ({
    page,
    request,
  }) => {
    const name = `Toggle Public ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto(`/calendars/${uuid}`);
    await page.getByRole('button', { name: /share calendar/i }).click();
    await page.getByRole('switch').click();
    await expect(
      page.getByText('Public — anyone with the link can view')
    ).toBeVisible();
  });

  test('@4.4 share buttons should become enabled after making the calendar public', async ({
    page,
    request,
  }) => {
    const name = `Enable Share Buttons ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto(`/calendars/${uuid}`);
    await page.getByRole('button', { name: /share calendar/i }).click();
    await page.getByRole('switch').click();
    await expect(
      page.getByRole('button', { name: /whatsapp/i })
    ).not.toBeDisabled();
  });

  test('@4.5 should copy the share link to the clipboard', async ({
    page,
    request,
  }) => {
    await page.context().grantPermissions(['clipboard-write']);
    const name = `Copy Link ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await makeCalendarPublic(request, token, uuid);
    await page.goto(`/calendars/${uuid}`);
    await page.getByRole('button', { name: /share calendar/i }).click();
    await page.getByRole('button', { name: /copy link/i }).click();
    await expect(page.getByRole('button', { name: /copied!/i })).toBeVisible();
  });

  test('@4.6 should invite another user as an editor by email', async ({
    page,
    request,
  }) => {
    const calendarName = `Invite Calendar ${Date.now()}`;
    const secondEmail = `e2e+invite+${Date.now()}@kino.com`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, calendarName);
    const secondUserId = await createTestUser(
      request,
      secondEmail,
      'testpassword123',
      'Invitee User'
    );
    try {
      await page.goto(`/calendars/${uuid}/edit`);
      await page.getByPlaceholder('email@example.com').fill(secondEmail);
      await page.getByRole('button', { name: /^invite$/i }).click();
      await expect(
        page.getByText(`An email has been sent to ${secondEmail}`).first()
      ).toBeVisible();
    } finally {
      await deleteUserById(request, secondUserId);
    }
  });

  test('@4.7 invited editor should appear in the members list', async ({
    page,
    request,
  }) => {
    const calendarName = `Members List ${Date.now()}`;
    const secondEmail = `e2e+member+${Date.now()}@kino.com`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, calendarName);
    const secondUserId = await createTestUser(
      request,
      secondEmail,
      'testpassword123',
      'Invitee User'
    );
    try {
      await page.goto(`/calendars/${uuid}/edit`);
      await page.getByPlaceholder('email@example.com').fill(secondEmail);
      await page.getByRole('button', { name: /^invite$/i }).click();
      await expect(
        page.getByText(`An email has been sent to ${secondEmail}`).first()
      ).toBeVisible();
      await page.reload();
      await expect(page.getByText(secondEmail)).toBeVisible();
    } finally {
      await deleteUserById(request, secondUserId);
    }
  });

  test('@4.8 should show a confirmation dialog when removing an editor', async ({
    page,
    request,
  }) => {
    const calendarName = `Remove Member ${Date.now()}`;
    const secondEmail = `e2e+remove+${Date.now()}@kino.com`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, calendarName);
    const secondUserId = await createTestUser(
      request,
      secondEmail,
      'testpassword123',
      'Invitee User'
    );
    try {
      await inviteMember(request, token, uuid, secondEmail);
      await page.goto(`/calendars/${uuid}/edit`);
      const memberRow = page
        .locator('.divide-y > div')
        .filter({ hasText: secondEmail });
      await memberRow.getByRole('button').click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Remove member' })
      ).toBeVisible();
    } finally {
      await deleteUserById(request, secondUserId);
    }
  });
});
