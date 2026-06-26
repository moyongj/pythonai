import Image from 'next/image';

/**
 * 页脚组件，显示应用名称和作者信息
 */
export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50 py-4">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
        <p className="mb-2">
          码上成长——Python代码智能评价与学情诊断AI智能体   By 墨老师
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <a
            href="https://beian.miit.gov.cn/#/Integrated/index"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            粤ICP备2026083301号-1
          </a>
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=44051102001182"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Image
              src="/beian.png"
              alt="公安备案"
              width={14}
              height={14}
              className="inline-block"
            />
            粤公网安备44051102001182号
          </a>
        </div>
      </div>
    </footer>
  );
}