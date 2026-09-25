import axiosInstance from './axios'
import type { Frame, GifRecord, PhotoRecord, RecordingRecord } from '@/types/capture.types'

export async function getFrames(name?: string): Promise<Frame[]> {
  const url = name ? `/frames?name=${encodeURIComponent(name)}` : '/frames'
  const res = await axiosInstance.get<Frame[]>(url)
  return res.data
}

export async function getFramesByAspectRatio(aspectRatio: string, name?: string): Promise<Frame[]> {
  const url = name
    ? `/frames/aspect-ratio/${aspectRatio}?name=${encodeURIComponent(name)}`
    : `/frames/aspect-ratio/${aspectRatio}`
  const res = await axiosInstance.get<Frame[]>(url)
  return res.data
}

export async function getCustomerByAccountId(accountId: string) {
  const res = await axiosInstance.get(`/customers/account/${accountId}`)
  return res.data
}

export async function savePhoto(params: {
  accountId: string
  frameId?: string
  processedBlob: Blob
  originalBlob: Blob
}): Promise<PhotoRecord> {
  const formData = new FormData()
  formData.append('accountId', params.accountId)
  if (params.frameId) formData.append('frameId', params.frameId)
  formData.append('mediaType', 'photo')
  formData.append('processedFile', params.processedBlob, 'processed.png')
  formData.append('originalFile', params.originalBlob, 'original.png')

  const res = await axiosInstance.post<PhotoRecord>('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function saveRecording(params: {
  accountId: string
  videoBlob: Blob
}): Promise<RecordingRecord> {
  const formData = new FormData()
  formData.append('accountId', params.accountId)
  formData.append('file', params.videoBlob, 'recording.webm')

  const res = await axiosInstance.post<RecordingRecord>('/recordings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function saveGif(params: {
  accountId: string
  gifType: string
  gifBlob: Blob
}): Promise<GifRecord> {
  const formData = new FormData()
  formData.append('accountId', params.accountId)
  formData.append('gifType', params.gifType)
  formData.append('file', params.gifBlob, 'animated.gif')

  const res = await axiosInstance.post<GifRecord>('/gifs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function createSessionResult(params: {
  accountId: string
  sessionType: 'single' | 'group'
  photoId?: string
  recordingId?: string
  gifId?: string
}) {
  const res = await axiosInstance.post('/session-results', params)
  return res.data
}
