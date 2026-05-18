import type { NewProjectInput, Project, ProjectPatch } from './projects'

export interface ProjectsAPI {
  list: () => Promise<Project[]>
  get: (id: string) => Promise<Project | null>
  create: (input: NewProjectInput) => Promise<Project>
  update: (id: string, patch: ProjectPatch) => Promise<Project>
  delete: (id: string) => Promise<void>
}

export interface AppAPI {
  projects: ProjectsAPI
}
