import type { AppInfo } from './app'
import type { NewProjectInput, Project, ProjectPatch } from './projects'
import type {
  NewProjectVersionInput,
  ProjectVersion,
  ProjectVersionPatch
} from './project_versions'
import type { Category, CategoryPatch, NewCategoryInput } from './categories'
import type { NewTestCaseInput, TestCase, TestCasePatch, TestCaseWithSteps } from './test_cases'
import type { NewTestPlanInput, TestPlan, TestPlanPatch, TestPlanWithTasks } from './test_plans'
import type { NewTestCycleInput, TestCycle, TestCyclePatch } from './test_cycles'
import type { Assignment, AssignmentStatus, AssignmentUpdate } from './assignments'
import type { NewTestTypeInput, TestType, TestTypePatch } from './test_types'
import type { UpdaterEvent, UpdaterInvokeResult } from './updater'

export interface ProjectsAPI {
  list: () => Promise<Project[]>
  get: (id: string) => Promise<Project | null>
  create: (input: NewProjectInput) => Promise<Project>
  update: (id: string, patch: ProjectPatch) => Promise<Project>
  delete: (id: string) => Promise<void>
}

export interface ProjectVersionsAPI {
  list: (projectId: string) => Promise<ProjectVersion[]>
  get: (id: string) => Promise<ProjectVersion | null>
  create: (input: NewProjectVersionInput) => Promise<ProjectVersion>
  update: (id: string, patch: ProjectVersionPatch) => Promise<ProjectVersion>
  delete: (id: string) => Promise<void>
}

export interface CategoriesAPI {
  list: (projectId: string) => Promise<Category[]>
  listTop: (projectId: string) => Promise<Category[]>
  listSub: (parentId: string) => Promise<Category[]>
  get: (id: string) => Promise<Category | null>
  create: (input: NewCategoryInput) => Promise<Category>
  update: (id: string, patch: CategoryPatch) => Promise<Category>
  delete: (id: string) => Promise<void>
}

export interface TestCasesAPI {
  list: (projectId: string) => Promise<TestCase[]>
  listBySubcategory: (subcategoryId: string) => Promise<TestCase[]>
  get: (id: string) => Promise<TestCase | null>
  getWithSteps: (id: string) => Promise<TestCaseWithSteps | null>
  search: (projectId: string, query: string) => Promise<TestCase[]>
  create: (input: NewTestCaseInput) => Promise<TestCaseWithSteps>
  update: (id: string, patch: TestCasePatch) => Promise<TestCaseWithSteps>
  delete: (id: string) => Promise<void>
  importJson: (projectId: string, payload: NewTestCaseInput[]) => Promise<number>
  exportJson: (projectId: string) => Promise<TestCaseWithSteps[]>
}

export interface TestPlansAPI {
  list: (projectId: string) => Promise<TestPlan[]>
  get: (id: string) => Promise<TestPlan | null>
  getWithTasks: (id: string) => Promise<TestPlanWithTasks | null>
  create: (input: NewTestPlanInput) => Promise<TestPlanWithTasks>
  update: (id: string, patch: TestPlanPatch) => Promise<TestPlanWithTasks>
  delete: (id: string) => Promise<void>
}

export interface TestCyclesAPI {
  list: (planId: string) => Promise<TestCycle[]>
  listByProject: (projectId: string) => Promise<TestCycle[]>
  get: (id: string) => Promise<TestCycle | null>
  create: (input: NewTestCycleInput) => Promise<TestCycle>
  update: (id: string, patch: TestCyclePatch) => Promise<TestCycle>
  delete: (id: string) => Promise<void>
}

export interface AssignmentRow extends Assignment {
  test_case_display_id: string
  test_case_name: string
}

export interface AssignmentsAPI {
  list: (cycleId: string) => Promise<AssignmentRow[]>
  assign: (cycleId: string, caseIds: string[]) => Promise<{ inserted: number }>
  batchUnassign: (ids: string[]) => Promise<{ removed: number }>
  setStatus: (id: string, status: AssignmentStatus, notes?: string | null) => Promise<Assignment>
  update: (id: string, patch: AssignmentUpdate) => Promise<Assignment>
  progress: (cycleId: string) => Promise<{
    total: number
    pass: number
    fail: number
    blocked: number
    unexecuted: number
  }>
}

export interface TestTypesAPI {
  list: (projectId: string) => Promise<TestType[]>
  get: (id: string) => Promise<TestType | null>
  create: (input: NewTestTypeInput) => Promise<TestType>
  update: (id: string, patch: TestTypePatch) => Promise<TestType>
  delete: (id: string) => Promise<void>
  getCases: (id: string) => Promise<string[]>
  setCases: (id: string, caseIds: string[]) => Promise<void>
  counts: (projectId: string) => Promise<Record<string, number>>
}

export interface BackupAPI {
  export: () => Promise<{ canceled: boolean; path: string | null }>
  import: () => Promise<{ canceled: boolean }>
}

export interface UpdaterAPI {
  check: () => Promise<UpdaterInvokeResult>
  download: () => Promise<UpdaterInvokeResult>
  install: () => Promise<void>
  onEvent: (cb: (event: UpdaterEvent) => void) => () => void
}

export interface AppInfoAPI {
  info: () => Promise<AppInfo>
}

export interface AppAPI {
  app: AppInfoAPI
  projects: ProjectsAPI
  projectVersions: ProjectVersionsAPI
  categories: CategoriesAPI
  cases: TestCasesAPI
  plans: TestPlansAPI
  cycles: TestCyclesAPI
  assignments: AssignmentsAPI
  types: TestTypesAPI
  backup: BackupAPI
  updater: UpdaterAPI
}
