"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"

export default function DocumentPrintPage() {
  const params = useParams()
  const documentId = params?.documentId as string

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-screen w-screen">
      <iframe
        title="document-print"
        src={`/api/documents/${documentId}/preview`}
        className="h-full w-full"
      />
    </div>
  )
}
