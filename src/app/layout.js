import './globals.css';
import AuthGuard from '../components/AuthGuard';

export const metadata = {
  title: 'Meu Negócio',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        {/* Aqui é onde a mágica acontece. Se não tiver o AuthGuard aqui, o login não aparece! */}
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
