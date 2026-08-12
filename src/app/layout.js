import './globals.css';
import AuthGuard from '../components/AuthGuard';

export const metadata = {
  title: 'Meu Negócio',
  description: 'Sistema completo de gestão, fiados e estoque.',
  manifest: '/manifest.json', // Chama o arquivo que transforma em App
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meu Negócio',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        {/* O AuthGuard abaixo impede que qualquer página seja aberta sem login/pagamento */}
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
