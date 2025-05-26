"use client"

import { useState, useRef } from "react"
import { Mic, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceRecorderProps {
  onVoiceMessage: (audioBlob: Blob, duration: number) => void
}

export default function VoiceRecorder({ onVoiceMessage }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" })
        onVoiceMessage(audioBlob, recordingTime)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isRecording) {
    return (
      <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-red-600">{formatTime(recordingTime)}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelRecording}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={stopRecording}
          className="text-green-600 hover:text-green-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={startRecording}>
      <Mic className="w-4 h-4" />
    </Button>
  )
}
