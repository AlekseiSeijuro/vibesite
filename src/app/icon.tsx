import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #c026d3 0%, #9333ea 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Буква V как логотип */}
        <div
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 900,
            fontFamily: 'serif',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}
        >
          V
        </div>
      </div>
    ),
    { ...size }
  )
}
