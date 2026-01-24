'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'

interface SignatureCaptureProps {
  onSignatureChange: (svg: string) => void
  disabled?: boolean
  width?: number
  height?: number
}

export function SignatureCapture({
  onSignatureChange,
  disabled = false,
  width = 500,
  height = 150
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [paths, setPaths] = useState<Array<{ x: number; y: number }[]>>([])
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  // Get canvas coordinates from mouse/touch event
  const getCoordinates = useCallback(
    (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      if ('touches' in e) {
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY
        }
      } else {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        }
      }
    },
    []
  )

  // Draw all paths on canvas
  const drawPaths = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const allPaths = [...paths, currentPath]

    allPaths.forEach((path) => {
      if (path.length < 2) return

      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)

      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y)
      }

      ctx.stroke()
    })
  }, [paths, currentPath])

  useEffect(() => {
    drawPaths()
  }, [drawPaths])

  // Convert paths to SVG
  const pathsToSvg = useCallback((): string => {
    const allPaths = [...paths]
    if (allPaths.length === 0) return ''

    const pathStrings = allPaths.map((path) => {
      if (path.length < 2) return ''
      const d = path.reduce((acc, point, idx) => {
        if (idx === 0) return `M ${point.x} ${point.y}`
        return `${acc} L ${point.x} ${point.y}`
      }, '')
      return `<path d="${d}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    })

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${pathStrings.join('')}</svg>`
  }, [paths, width, height])

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return

      e.preventDefault()
      const coords = getCoordinates(e.nativeEvent as MouseEvent | TouchEvent)
      if (!coords) return

      setIsDrawing(true)
      setCurrentPath([coords])
    },
    [disabled, getCoordinates]
  )

  // Continue drawing
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return

      e.preventDefault()
      const coords = getCoordinates(e.nativeEvent as MouseEvent | TouchEvent)
      if (!coords) return

      setCurrentPath((prev) => [...prev, coords])
    },
    [isDrawing, disabled, getCoordinates]
  )

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)
    if (currentPath.length > 1) {
      setPaths((prev) => [...prev, currentPath])
      setHasSignature(true)
    }
    setCurrentPath([])
  }, [isDrawing, currentPath])

  // Clear signature
  const clearSignature = useCallback(() => {
    setPaths([])
    setCurrentPath([])
    setHasSignature(false)
    onSignatureChange('')

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [onSignatureChange])

  // Update parent when paths change
  useEffect(() => {
    if (hasSignature && paths.length > 0) {
      onSignatureChange(pathsToSvg())
    }
  }, [paths, hasSignature, onSignatureChange, pathsToSvg])

  // Handle mouse leaving canvas
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      stopDrawing()
    }
  }, [isDrawing, stopDrawing])

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-lg ${
          disabled ? 'bg-muted cursor-not-allowed' : 'bg-white cursor-crosshair'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none"
          style={{ maxWidth: `${width}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm">
              Draw your signature here
            </p>
          </div>
        )}
      </div>
      {hasSignature && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
        >
          <Eraser className="h-4 w-4 mr-2" /> Clear
        </Button>
      )}
    </div>
  )
}
