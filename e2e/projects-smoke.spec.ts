import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page
} from '@playwright/test'
import { join } from 'path'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'

test.describe('projects smoke', () => {
  let app: ElectronApplication
  let window: Page
  let userDataDir: string

  test.beforeAll(async () => {
    userDataDir = mkdtempSync(join(tmpdir(), 'qa-workspace-e2e-'))
    app = await electron.launch({
      args: [join(__dirname, '..', 'out', 'main', 'index.js')],
      env: {
        ...process.env,
        QA_WORKSPACE_USER_DATA: userDataDir,
        QA_WORKSPACE_DB_PATH: join(userDataDir, 'qa-workspace.db'),
        NODE_ENV: 'test'
      }
    })
    // Surface main-process stderr so CI logs capture crashes / ABI errors
    app.process().stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write('[electron-main] ' + chunk.toString())
    })
    window = await app.firstWindow()
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    await app.close()
    rmSync(userDataDir, { recursive: true, force: true })
  })

  test('app launches with empty Projects state', async () => {
    await expect(window.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible()
    await expect(window.getByText('No projects yet')).toBeVisible()
    await expect(window.getByRole('button', { name: /new project/i }).first()).toBeVisible()
  })

  test('create a project and see it in the list', async () => {
    await window
      .getByRole('button', { name: /new project/i })
      .first()
      .click()

    await expect(window.getByRole('dialog')).toBeVisible()
    await window.getByLabel('Display prefix').fill('arr')
    await window.getByLabel('Name').fill('Arrival')
    await window.getByLabel('Description (optional)').fill('First project')
    await window.getByRole('button', { name: /create project/i }).click()

    // Wait for the dialog to close (signals the create mutation succeeded)
    await expect(window.getByRole('dialog')).toBeHidden()

    // The project list should update and show the new project.
    // Use the link role (each project card is a <Link>) to avoid matching the
    // "Created Arrival" success toast which also contains the text "Arrival".
    await expect(window.getByRole('link', { name: /ARR.*Arrival/i })).toBeVisible()
    await expect(window.getByText('No projects yet')).toBeHidden()
  })

  test('reject duplicate display prefix', async () => {
    await window
      .getByRole('button', { name: /new project/i })
      .first()
      .click()

    await expect(window.getByRole('dialog')).toBeVisible()
    await window.getByLabel('Display prefix').fill('ARR')
    await window.getByLabel('Name').fill('Duplicate')
    await window.getByRole('button', { name: /create project/i }).click()

    // The Electron IPC propagates the UniqueConstraintError message.
    // The renderer shows it via toast.error("Create failed: ...already exists...").
    await expect(window.getByText(/already exists/i)).toBeVisible({ timeout: 5000 })

    // Dismiss dialog — Cancel button closes it without saving
    await window.getByRole('button', { name: /cancel/i }).click()
    await expect(window.getByRole('dialog')).toBeHidden()
  })
})
