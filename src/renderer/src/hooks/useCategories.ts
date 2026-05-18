/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Category, CategoryPatch, NewCategoryInput } from '@shared/types/categories'

const key = (projectId: string): readonly unknown[] => ['categories', projectId] as const

export function useCategories(projectId: string | undefined) {
  return useQuery({
    queryKey: key(projectId ?? ''),
    queryFn: () => window.api.categories.list(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useCreateCategory(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NewCategoryInput) => window.api.categories.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useUpdateCategory(projectId: string) {
  const qc = useQueryClient()
  return useMutation<Category, Error, { id: string; patch: CategoryPatch }>({
    mutationFn: ({ id, patch }) => window.api.categories.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useDeleteCategory(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => window.api.categories.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}
