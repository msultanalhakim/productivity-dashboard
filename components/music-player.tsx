"use client"

import { useState, useRef, useEffect } from "react"
import { Music, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Track {
  id: string
  title: string
  artist: string
  url: string
}

const TRACKS: Track[] = [
    {
      id: "1",
      title: "DJ Tor Monitor Ketua",
      artist: "Ecko Show",
      url: "/music/Tor Monitor Ketua.mp3"
    },
    {
      id: "2",
      title: "DJ Tante Culik Aku dong",
      artist: "Mala Agatha",
      url: "/music/Tante Culik Aku Dong.mp3"
    },
    {
      id: "3",
      title: "DJ Voice In My Head",
      artist: "Falling In Reverse",
      url: "/music/Voice In My Head.mp3"
    },
    {
      id: "4",
      title: "DJ So Asu",
      artist: "Naykilla",
      url: "/music/So Asu.mp3"
    },
    {
      id: "5",
      title: "DJ Breakbeat Akimilaku",
      artist: "DreFlySlowly",
      url: "/music/Breakbeat Akimilaku.mp3"
    },
    {
      id: "6",
      title: "DJ Tabola Bale",
      artist: "Maman Fvndy",
      url: "/music/Tabola Bale.mp3"
    },
    {
      id: "7",
      title: "DJ Bintang 5",
      artist: "Maman Fnvdy",
      url: "/music/Bintang 5.mp3"
    },
    {
      id: "8",
      title: "DJ Ngga Dulu",
      artist: "Maman Fnvdy",
      url: "/music/Ngga Dulu.mp3"
    }
  ]

export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentTrack = TRACKS[currentTrackIndex]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load()
      // Auto-play jika sedang playing
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Playback error:", error)
          setIsPlaying(false)
        })
      }
    }
  }, [currentTrackIndex])

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.error("Playback error:", error)
        setIsPlaying(false)
      }
    }
  }

  const handlePrevious = () => {
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : TRACKS.length - 1
    setCurrentTrackIndex(newIndex)
  }

  const handleNext = () => {
    const newIndex = currentTrackIndex < TRACKS.length - 1 ? currentTrackIndex + 1 : 0
    setCurrentTrackIndex(newIndex)
  }

  const handleTrackEnd = () => {
    // Auto-play next track (loop terus selama isPlaying true)
    const newIndex = currentTrackIndex < TRACKS.length - 1 ? currentTrackIndex + 1 : 0
    setCurrentTrackIndex(newIndex)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl transition-colors",
          isPlaying
            ? "border-cyan bg-cyan/10 text-cyan animate-pulse"
            : "border-crimson bg-crimson/10 text-crimson"
        )}
        aria-label="Music Player"
      >
        <Music className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            {/* Track Info */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentTrack.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrevious}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Previous track"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan text-background transition-all hover:bg-cyan/90"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Next track"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 rounded-lg appearance-none bg-secondary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan"
              />
            </div>

            {/* Track List */}
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {TRACKS.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => setCurrentTrackIndex(index)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                    index === currentTrackIndex
                      ? "bg-cyan/10 text-cyan"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <p className="text-xs font-medium truncate w-full">{track.title}</p>
                  <p className="text-[10px] truncate w-full">{track.artist}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnd}
      />
    </div>
  )
}