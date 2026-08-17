import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import './Dashboard.css'

const PLAYLIST_ID = 'RDEMj0weLcfSL_fmHFYGkc7UEQ'
const FIRST_VIDEO = 'TU1HQnU_9ME'


function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Dashboard() {
  const navigate     = useNavigate()
  const playerRef    = useRef(null)
  const containerRef = useRef(null)
  const intervalRef  = useRef(null)

  const [isPlaying,   setIsPlaying]   = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [ready,       setReady]       = useState(false)
  const [title,       setTitle]       = useState('Loading playlist...')
  const [thumb,       setThumb]       = useState(`https://img.youtube.com/vi/${FIRST_VIDEO}/hqdefault.jpg`)
  const [videoId,     setVideoId]     = useState(FIRST_VIDEO)
  const [playlistData, setPlaylistData] = useState([])
  const [trackIndex,  setTrackIndex]  = useState(0)

  const startTick = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const p = playerRef.current
      if (!p?.getCurrentTime) return
      setCurrentTime(p.getCurrentTime())
      setDuration(p.getDuration())
    }, 500)
  }
  const stopTick = () => clearInterval(intervalRef.current)

  const syncTrackInfo = (player) => {
    const data = player.getVideoData?.()
    if (data?.video_id) {
      setVideoId(data.video_id)
      setThumb(`https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`)
      setTitle(data.title || 'Unknown')
    }
    // sync playlist index
    const idx = player.getPlaylistIndex?.()
    if (typeof idx === 'number' && idx >= 0) setTrackIndex(idx)
    // grab full playlist once
    const list = player.getPlaylist?.()
    if (list?.length) setPlaylistData(list)
  }

  useEffect(() => {
    const init = () => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: FIRST_VIDEO,
        playerVars: {
          autoplay:        0,
          controls:        0,
          rel:             0,
          modestbranding:  1,
          playsinline:     1,
          listType:        'playlist',
          list:            PLAYLIST_ID,
        },
        events: {
          onReady(e) {
            setReady(true)
            syncTrackInfo(e.target)
            setDuration(e.target.getDuration())
          },
          onStateChange(e) {
            const S = window.YT.PlayerState
            if (e.data === S.PLAYING) {
              setIsPlaying(true)
              syncTrackInfo(e.target)
              setDuration(e.target.getDuration())
              startTick()
            } else {
              setIsPlaying(false)
              stopTick()
            }
            if (e.data === S.ENDED) {
              e.target.nextVideo()
            }
          },
        },
      })
    }

    if (window.YT?.Player) { init(); return }
    const tag = document.createElement('script')
    tag.src   = 'https://www.youtube.com/iframe_api'
    tag.async = true
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = init
    return () => { window.onYouTubeIframeAPIReady = null }
  }, [])

  useEffect(() => () => stopTick(), [])

  const togglePlay = () => {
    if (!ready) return
    isPlaying ? playerRef.current.pauseVideo()
              : playerRef.current.playVideo()
  }

  const prev = () => {
    if (!ready) return
    playerRef.current.previousVideo()
    setTimeout(() => syncTrackInfo(playerRef.current), 800)
  }

  const next = () => {
    if (!ready) return
    playerRef.current.nextVideo()
    setTimeout(() => syncTrackInfo(playerRef.current), 800)
  }

  const handleSeek = (e) => {
    const val = Number(e.target.value)
    setCurrentTime(val)
    playerRef.current?.seekTo(val, true)
  }

  const pct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="dash-root">

      {/* hidden iframe — must be visible enough for autoplay policies */}
      <div className="yt-hidden"><div ref={containerRef} /></div>

      {/* ── Navbar ── */}
      <nav className="navbar">
        <span className="nav-brand">ShivSofts</span>
        <button
          className="nav-logout"
          onClick={() => { localStorage.removeItem('token'); navigate('/login') }}
        >
          Log out
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <img src={heroImg} alt="" className="hero-bg" />
        <div className="hero-gradient" />
        <div className="hero-text">
          <p className="hero-sub">Now Streaming</p>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-meta">
            {playlistData.length
              ? `Track ${trackIndex + 1} of ${playlistData.length}`
              : 'YouTube Mix Playlist'}
          </p>
        </div>
      </section>

      {/* ── Player ── */}
      <section className="player-section">
        <div className="player-card">

          {/* album art */}
          <img className="album-art" src={thumb} alt={title} />

          {/* controls side */}
          <div className="player-body">

            <div className="player-top">
              <p className="track-title">{title}</p>
              {playlistData.length > 0 && (
                <span className="track-badge">
                  {trackIndex + 1}/{playlistData.length}
                </span>
              )}
            </div>

            {/* seek */}
            <div className="seek-row">
              <span className="seek-time">{formatTime(currentTime)}</span>
              <div className="seek-track">
                <input
                  type="range"
                  className="seek-slider"
                  min={0} max={duration || 100} step={1}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{ '--pct': `${pct}%` }}
                />
              </div>
              <span className="seek-time">{formatTime(duration)}</span>
            </div>

            {/* buttons */}
            <div className="controls">

              <button className="ctrl prev-next" onClick={prev} disabled={!ready} title="Previous">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
                </svg>
              </button>

              <button className="ctrl play" onClick={togglePlay} disabled={!ready}>
                {isPlaying
                  ? <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  : <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                }
              </button>

              <button className="ctrl prev-next" onClick={next} disabled={!ready} title="Next">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
                </svg>
              </button>

            </div>
          </div>
        </div>


      </section>
    </div>
  )




  {/* playlist sidebar — shown once YT gives us the list */}
        {/* {playlistData.length > 0 && (
          <ul className="tracklist">
            {playlistData.map((vid, i) => (
              <li
                key={`${vid}-${i}`}
                className={`tl-item ${i === trackIndex ? 'tl-active' : ''}`}
                onClick={() => {
                  playerRef.current?.playVideoAt(i)
                  setTrackIndex(i)
                  setTimeout(() => syncTrackInfo(playerRef.current), 800)
                }}
              >
                <img
                  className="tl-thumb"
                  src={`https://img.youtube.com/vi/${vid}/default.jpg`}
                  alt=""
                />
                <span className="tl-num">{i + 1}</span>
                {i === trackIndex && isPlaying && (
                  <span className="tl-bars"><span/><span/><span/></span>
                )}
              </li>
            ))}
          </ul>
        )} */}
}
