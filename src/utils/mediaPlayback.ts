export type MediaPlayer = 'image' | 'pdf' | 'video' | 'audio' | 'iframe' | 'link'

export function mediaEmbed(url: string): string | null {
  const value = url.trim()
  if (!value) {
    return null
  }

  const youtube = value.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}`
  }

  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`
  }

  const spotify = value.match(/open\.spotify\.com\/(episode|track|playlist|album)\/([A-Za-z0-9]+)/)
  if (spotify) {
    return `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`
  }

  if (/soundcloud\.com\//.test(value) && !value.includes('w.soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(value)}&color=%23ff5500&auto_play=false`
  }

  return null
}

export function mediaPlayer(fileType: string, url: string): MediaPlayer {
  const embed = mediaEmbed(url)
  if (fileType === 'image') {
    return 'image'
  }
  if (fileType === 'pdf') {
    return 'pdf'
  }
  if (fileType === 'audio') {
    return embed ? 'iframe' : 'audio'
  }
  if (fileType === 'video') {
    return embed ? 'iframe' : 'video'
  }
  return 'link'
}
