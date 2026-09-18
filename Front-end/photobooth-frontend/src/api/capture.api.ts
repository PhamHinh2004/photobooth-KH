import axiosInstance from './axios'
import type { Frame, PhotoRecord } from '@/types/capture.types'

// Lấy danh sách frames (public)
export async function getFrames(): Promise<Frame[]> {
  const res = await axiosInstance.get<Frame[]>('/frames')
  return res.data
}

// Lấy customer profile theo accountId
export async function getCustomerByAccountId(accountId: string) {
  const res = await axiosInstance.get(`/customers/account/${accountId}`)
  return res.data
}

// Upload ảnh + tạo record Photo
export async function savePhoto(params: {
  customerId: string
  frameId?: string
  processedBlob: Blob
  originalBlob: Blob
}): Promise<PhotoRecord> {
  const formData = new FormData()
  formData.append('customerId', params.customerId)
  if (params.frameId) formData.append('frameId', params.frameId)
  formData.append('mediaType', 'photo')
  formData.append('sessionType', 'single')
  formData.append('processedFile', params.processedBlob, 'processed.png')
  formData.append('originalFile', params.originalBlob, 'original.png')

  const res = await axiosInstance.post<PhotoRecord>('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
