"use client"

import { useCallback, useRef } from "react"
import { useParams } from "next/navigation"

export default function DocumentPrintPage() {
  const params = useParams()
  const documentId = params?.documentId as string
  const printedRef = useRef(false)

  const handleIframeLoad = useCallback(() => {
    if (printedRef.current) return

    const iframe = document.getElementById("document-print-frame") as HTMLIFrameElement | null
    const contentWindow = iframe?.contentWindow
    if (!contentWindow) return

    printedRef.current = true
    contentWindow.focus()
    contentWindow.print()
  }, [])

  return (
    <div className="h-screen w-screen print:h-auto print:w-auto">
      <iframe
        id="document-print-frame"
        title="document-print"
        src={`/api/documents/${documentId}/preview`}
        onLoad={handleIframeLoad}
        className="h-full w-full"
      />
    </div>
  )
}
