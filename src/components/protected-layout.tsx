'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

/**
 * ProtectedLayout组件属性接口
 */
interface ProtectedLayoutProps {
  children: React.ReactNode;
}

/**
 * ProtectedLayout组件
 * 
 * 受保护页面的布局组件，提供统一的页面结构：
 * - Header：顶部导航栏
 * - main：主内容区域（动态渲染子组件）
 * - Footer：页脚
 * 
 * 所有需要用户登录后才能访问的页面都应使用此布局。
 * 
 * @component
 * @author 码上成长项目组
 * @version 1.0.0
 * 
 * @param {ProtectedLayoutProps} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件内容
 * 
 * @returns {JSX.Element} 布局组件
 */
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}