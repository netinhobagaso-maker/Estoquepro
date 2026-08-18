import './globals.css';

export const metadata = {
  title: 'Meu Negócio Pro',
  description: 'Sistema de Vendas e Estoque na palma da mão',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
