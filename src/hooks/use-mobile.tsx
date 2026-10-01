import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Check both standard narrow width (< 768px) and smartphone landscape (short height <= 500px with landscape ratio)
    const mqlWidth = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const mqlLandscape = window.matchMedia(`(max-height: 500px) and (orientation: landscape)`)

    const onChange = () => {
      const isNarrow = window.innerWidth < MOBILE_BREAKPOINT
      const isShortLandscape = window.innerHeight <= 500 && window.innerWidth > window.innerHeight
      setIsMobile(isNarrow || isShortLandscape)
    }

    mqlWidth.addEventListener("change", onChange)
    mqlLandscape.addEventListener("change", onChange)
    onChange()

    return () => {
      mqlWidth.removeEventListener("change", onChange)
      mqlLandscape.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}
