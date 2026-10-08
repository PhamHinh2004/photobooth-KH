const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

export function getPostShareUrl(postId: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}/posts/${encodeURIComponent(postId)}/share`
}

async function copyShareUrl(shareUrl: string) {
  try {
    await navigator.clipboard?.writeText(shareUrl)
  } catch { }
}

export async function sharePostToFacebook(postId: string) {
  const shareUrl = getPostShareUrl(postId)
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const popup = window.open(facebookUrl, 'facebook-share', 'width=700,height=600,noopener,noreferrer')

  if (!popup) {
    await copyShareUrl(shareUrl)
    return { opened: false, shareUrl }
  }

  return { opened: true, shareUrl }
}
