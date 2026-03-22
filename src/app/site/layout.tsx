// Этот layout намеренно пустой — клиентские сайты отдаются
// как чистый HTML без каких-либо обёрток Vibesite
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
