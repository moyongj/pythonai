import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '码上成长 | Python代码智能评价与学情诊断AI智能体',
    template: '%s | 码上成长',
  },
  description:
    '码上成长是面向中职学生的 Python代码智能评价与学情诊断AI智能体，从题目理解、逻辑思路、代码可读性、语法掌握四个维度静态分析代码，生成评价报告与个性化练习。',
  keywords: [
    '码上成长',
    'Python代码评价',
    '学情诊断',
    'AI教学',
    '中职编程',
    '代码智能评测',
  ],
  authors: [{ name: '码上成长 Team' }],
  generator: '码上成长',
  openGraph: {
    title: '码上成长 | Python代码智能评价与学情诊断AI智能体',
    description:
      '从四大维度智能评价Python代码，定位易错知识点，生成个性化练习题，让每一次提交都成为成长的一步。',
    siteName: '码上成长',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${nunito.variable} antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}