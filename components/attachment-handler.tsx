"use client"

import type React from "react"

import { useRef } from "react"
import { Paperclip, ImageIcon, FileText, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AttachmentHandlerProps {
  onFileSelect: (file: File, type: string) => void
}

export default function AttachmentHandler({ onFileSelect }: AttachmentHandlerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (type: string) => {
    switch (type) {
      case "image":
        imageInputRef.current?.click()
        break
      case "video":
        videoInputRef.current?.click()
        break
      case "file":
        fileInputRef.current?.click()
        break
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file, type)
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" side="top">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleFileSelect("image")}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Photo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleFileSelect("video")}
            >
              <Video className="w-4 h-4 mr-2" />
              Video
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleFileSelect("file")}>
              <FileText className="w-4 h-4 mr-2" />
              Document
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleInputChange(e, "image")}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleInputChange(e, "video")}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => handleInputChange(e, "file")}
      />
    </>
  )
}
