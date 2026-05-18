export type UpdaterEventType =
  | 'checking-for-update'
  | 'update-available'
  | 'update-not-available'
  | 'download-progress'
  | 'update-downloaded'
  | 'error'

export interface UpdaterUpdateInfo {
  version: string
  releaseDate?: string
  releaseName?: string | null
  releaseNotes?: string | null
}

export interface UpdaterProgressInfo {
  total: number
  delta: number
  transferred: number
  percent: number
  bytesPerSecond: number
}

export interface UpdaterDownloadedInfo extends UpdaterUpdateInfo {
  downloadedFile?: string
}

export interface UpdaterErrorPayload {
  message: string
}

export type UpdaterEventPayload =
  | UpdaterUpdateInfo
  | UpdaterProgressInfo
  | UpdaterDownloadedInfo
  | UpdaterErrorPayload
  | undefined

export interface UpdaterEvent {
  type: UpdaterEventType
  payload?: UpdaterEventPayload
}

export interface UpdaterInvokeResult {
  ok: boolean
  error?: string
}
