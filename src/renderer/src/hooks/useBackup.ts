/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useExportBackup() {
  return useMutation({
    mutationFn: () => window.api.backup.export()
  })
}

export function useImportBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => window.api.backup.import(),
    onSuccess: (result) => {
      if (!result.canceled) qc.invalidateQueries()
    }
  })
}
