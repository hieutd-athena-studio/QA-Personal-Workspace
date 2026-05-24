import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

const m0001_initial: Migration = {
  version: 1,
  name: '0001-initial',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );

      INSERT OR IGNORE INTO meta (id, schema_version) VALUES (1, 0);

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        display_prefix TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        case_counter INTEGER NOT NULL DEFAULT 0,
        plan_counter INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS projects_display_prefix_idx
        ON projects(display_prefix);
    `)
  }
}

const m0002_core_entities: Migration = {
  version: 2,
  name: '0002-core-entities',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        parent_category_id TEXT,
        name TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS categories_project_idx ON categories(project_id);
      CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_category_id);

      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        subcategory_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        display_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        expected_result TEXT,
        version TEXT NOT NULL DEFAULT '1.0',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS test_cases_project_idx ON test_cases(project_id);
      CREATE INDEX IF NOT EXISTS test_cases_subcategory_idx ON test_cases(subcategory_id);
      CREATE UNIQUE INDEX IF NOT EXISTS test_cases_display_id_idx ON test_cases(project_id, display_id);

      CREATE TABLE IF NOT EXISTS test_case_steps (
        id TEXT PRIMARY KEY NOT NULL,
        test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        action TEXT NOT NULL,
        expected TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS test_case_steps_case_idx ON test_case_steps(test_case_id);

      CREATE TABLE IF NOT EXISTS test_plans (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        display_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        working_days REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS test_plans_project_idx ON test_plans(project_id);
      CREATE UNIQUE INDEX IF NOT EXISTS test_plans_display_id_idx ON test_plans(project_id, display_id);

      CREATE TABLE IF NOT EXISTS test_plan_tasks (
        id TEXT PRIMARY KEY NOT NULL,
        plan_id TEXT NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        name TEXT NOT NULL,
        duration_days REAL NOT NULL DEFAULT 0.25
      );
      CREATE INDEX IF NOT EXISTS test_plan_tasks_plan_idx ON test_plan_tasks(plan_id);

      CREATE TABLE IF NOT EXISTS test_cycles (
        id TEXT PRIMARY KEY NOT NULL,
        plan_id TEXT NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
        display_id TEXT NOT NULL,
        name TEXT NOT NULL,
        environment TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS test_cycles_plan_idx ON test_cycles(plan_id);

      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY NOT NULL,
        cycle_id TEXT NOT NULL REFERENCES test_cycles(id) ON DELETE CASCADE,
        test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'Unexecuted',
        notes TEXT,
        executed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS assignments_cycle_case_idx
        ON assignments(cycle_id, test_case_id);
      CREATE INDEX IF NOT EXISTS assignments_cycle_idx ON assignments(cycle_id);

      CREATE TABLE IF NOT EXISTS test_types (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS test_types_project_idx ON test_types(project_id);

      CREATE TABLE IF NOT EXISTS test_type_cases (
        test_type_id TEXT NOT NULL REFERENCES test_types(id) ON DELETE CASCADE,
        test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
        PRIMARY KEY (test_type_id, test_case_id)
      );
    `)
  }
}

const m0003_add_project_logo: Migration = {
  version: 3,
  name: '0003-add-project-logo',
  up: (db) => {
    const cols = db.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
    if (!cols.some((c) => c.name === 'logo')) {
      db.exec(`ALTER TABLE projects ADD COLUMN logo TEXT;`)
    }
  }
}

const m0004_project_metadata_and_versions: Migration = {
  version: 4,
  name: '0004-project-metadata-and-versions',
  up: (db) => {
    const cols = db.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
    if (!cols.some((c) => c.name === 'metadata')) {
      db.exec(`ALTER TABLE projects ADD COLUMN metadata TEXT;`)
    }
    if (!cols.some((c) => c.name === 'current_version_id')) {
      db.exec(`ALTER TABLE projects ADD COLUMN current_version_id TEXT;`)
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS project_versions (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        version TEXT NOT NULL,
        notes TEXT,
        released_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS project_versions_project_version_idx
        ON project_versions(project_id, version);
      CREATE INDEX IF NOT EXISTS project_versions_project_idx
        ON project_versions(project_id);
    `)
  }
}

export const ALL_MIGRATIONS: Migration[] = [
  m0001_initial,
  m0002_core_entities,
  m0003_add_project_logo,
  m0004_project_metadata_and_versions
]
