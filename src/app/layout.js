import './globals.css'

export const metadata = {
  title: 'Zipp - O motor do seu negócio',
  description: 'Sistema de gestão para pequenos empreendedores',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
