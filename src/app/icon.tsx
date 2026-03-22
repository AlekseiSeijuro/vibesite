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
        <div
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ✦
        </div>
      </div>
    ),
    { ...size }
  )
}
