import {
  expect,
  test
} from '@playwright/test';
import {
  login,
  resetTestData
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@5. feedback', () => {
  test('@5.1 should navigate to the Feedback page from the top bar', async ({
    page,
  }) => {
    await page.goto('/home');
    await page.getByRole('link', { name: 'Feedback' }).click();
    await expect(page).toHaveURL('/feedback');
  });

  test('@5.2 should submit feedback and see a success toast', async ({
    page,
  }) => {
    await page.goto('/feedback');
    await page
      .getByPlaceholder('Share your thoughts, ideas, or report an issue...')
      .fill('This is e2e test feedback.');
    await page.getByRole('button', { name: /send feedback/i }).click();
    await expect(
      page.getByText('Feedback sent. Thank you!').first()
    ).toBeVisible();
  });

  test('@5.3 submit button should be disabled when the textarea is empty', async ({
    page,
  }) => {
    await page.goto('/feedback');
    await expect(
      page.getByRole('button', { name: /send feedback/i })
    ).toBeDisabled();
  });

  test('@5.4 should vote on a wishlist item and see the count increase', async ({
    page,
  }) => {
    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('.divide-y > div').first();
    const countSpan = firstRow.locator('span.tabular-nums');
    const initialCount = Number(await countSpan.textContent());
    await firstRow.locator('button[aria-label]').click();
    await expect(countSpan).toHaveText(String(initialCount + 1));
  });

  test('@5.5 should remove a vote and see the count decrease', async ({
    page,
  }) => {
    await page.goto('/feedback');
    const firstRow = page.locator('.divide-y > div').first();
    const countSpan = firstRow.locator('span.tabular-nums');
    const voteBtn = firstRow.locator(
      'button[aria-label="Vote for this feature"]'
    );
    const removeBtn = firstRow.locator('button[aria-label="Remove vote"]');

    // Ensure we have a vote to remove — vote if not already voted
    if (await voteBtn.isVisible()) {
      await voteBtn.click();
      await removeBtn.waitFor();
    }

    const countBeforeRemove = Number(await countSpan.textContent());
    await removeBtn.click();
    await expect(countSpan).toHaveText(String(countBeforeRemove - 1));
  });
});
