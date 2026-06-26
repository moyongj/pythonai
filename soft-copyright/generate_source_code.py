#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
软著申请源代码生成脚本
================================

功能：
1. 按目录结构顺序收集项目核心源代码（排除第三方组件）
2. 每页固定50行，连续编页
3. 输出前30页和后30页（共60页）到独立文件
4. 生成完整的合并文档供参考

使用方式：
    python generate_source_code.py

输出文件（位于 output/ 目录）：
    软著源代码_前30页.txt
    软著源代码_后30页.txt
    软著源代码_完整版.txt
    页码对照表.txt
"""

import os
import sys
import re

# ============ 配置区 ============

# 项目根目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

# 需要扫描的源码目录
INCLUDE_DIRS = [
    'src/app',
    'src/lib',
    'src/components',
    'src/hooks',
]

# 需要排除的目录（第三方组件、无关文件）
EXCLUDE_DIRS = [
    'src/components/ui',
    'node_modules',
    '.next',
    'dist',
    'data',
]

# 需要包含的文件扩展名
INCLUDE_EXTENSIONS = ['.ts', '.tsx']

# 每页行数（软著要求 >= 50行）
LINES_PER_PAGE = 50

# 需要提交的页数
FRONT_PAGES = 30   # 前30页
BACK_PAGES = 30     # 后30页

# 输出目录
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'output')

# 文件读取优先级（控制目录遍历顺序）
DIR_PRIORITY = [
    'src/lib',
    'src/app/api',
    'src/app/login',
    'src/app/evaluate',
    'src/app/practice',
    'src/app/chat',
    'src/app/statistics',
    'src/app/resources',
    'src/app/admin',
    'src/app',
    'src/components',
    'src/hooks',
]

# =====================================


def should_exclude(path: str) -> bool:
    """判断路径是否应被排除"""
    normalized = path.replace('\\', '/')
    for excl in EXCLUDE_DIRS:
        excl_norm = excl.replace('\\', '/')
        if excl_norm in normalized:
            return True
    return False


def collect_source_files():
    """
    按优先级顺序收集所有源代码文件
    返回：[(relative_path, absolute_path), ...]
    """
    files_by_dir = {}

    for include_dir in INCLUDE_DIRS:
        full_dir = os.path.join(PROJECT_ROOT, include_dir)
        if not os.path.isdir(full_dir):
            continue

        for root, dirs, files in os.walk(full_dir):
            # 过滤排除目录
            dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]

            for fname in files:
                if not any(fname.endswith(ext) for ext in INCLUDE_EXTENSIONS):
                    continue
                full_path = os.path.join(root, fname)
                if should_exclude(full_path):
                    continue

                rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                # 确定优先级分组
                group = 'other'
                rel_slash = rel_path.replace('\\', '/')
                for priority_dir in DIR_PRIORITY:
                    if rel_slash.startswith(priority_dir.replace('\\', '/')):
                        group = priority_dir
                        break
                if group not in files_by_dir:
                    files_by_dir[group] = []
                files_by_dir[group].append((rel_path, full_path))

    # 按优先级拼接文件列表
    result = []
    for group in DIR_PRIORITY:
        if group in files_by_dir:
            files_by_dir[group].sort()
            result.extend(files_by_dir[group])

    # 添加未分类的文件
    if 'other' in files_by_dir:
        files_by_dir['other'].sort()
        result.extend(files_by_dir['other'])

    return result


def read_file_safe(filepath):
    """
    安全读取文件内容，尝试多种编码
    返回：行列表（不含换行符）
    """
    encodings = ['utf-8', 'gbk', 'gb2312', 'latin-1']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                lines = f.read().splitlines()
            return lines
        except (UnicodeDecodeError, UnicodeError):
            continue

    try:
        with open(filepath, 'rb') as f:
            content = f.read().decode('utf-8', errors='replace')
        return content.splitlines()
    except Exception:
        return ['# [读取文件失败: %s]' % os.path.basename(filepath)]


def format_code_document(all_lines):
    """
    将全部代码行格式化为带页码的文档
    all_lines: [(line_content, abs_path, line_num), ...]
    返回：[(page_num, [line_content, ...]), ...]
    """
    pages = []
    current_page_lines = []
    current_page_num = 1
    last_file = None

    for line_content, abs_path, line_num in all_lines:
        # 在每个文件开始时插入文件头注释
        if line_num == 1:
            # 补空行使当前页满
            while len(current_page_lines) < LINES_PER_PAGE and current_page_lines:
                current_page_lines.append('')
            if current_page_lines:
                pages.append((current_page_num, current_page_lines))
                current_page_num += 1
                current_page_lines = []

            # 插入文件名注释
            rel_path = abs_path.replace(PROJECT_ROOT + os.sep, '').replace('\\', '/')
            current_page_lines.append('// ' + '=' * 40)
            current_page_lines.append('// 文件: %s' % rel_path)
            current_page_lines.append('// ' + '=' * 40)
            last_file = rel_path

        # 去掉每行行首行尾空格（避免全是空格的空行影响行数统计）
        current_page_lines.append(line_content.rstrip())

        # 满一页
        if len(current_page_lines) >= LINES_PER_PAGE:
            pages.append((current_page_num, current_page_lines))
            current_page_num += 1
            current_page_lines = []

    # 最后一页补空行
    if current_page_lines:
        while len(current_page_lines) < LINES_PER_PAGE:
            current_page_lines.append('')
        pages.append((current_page_num, current_page_lines))

    return pages


def write_output_files(pages, total_lines, file_count):
    """将页码文档写入输出文件"""
    import os

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total_pages = len(pages)
    actual_front = min(FRONT_PAGES, total_pages)
    actual_back = min(BACK_PAGES, total_pages)

    if total_pages <= FRONT_PAGES + BACK_PAGES:
        actual_front = total_pages
        actual_back = 0

    # 1. 前30页
    front_pages = pages[:actual_front]
    front_path = os.path.join(OUTPUT_DIR, '软著源代码_前30页.txt')
    with open(front_path, 'w', encoding='utf-8') as f:
        f.write('软件名称：码上成长Python智能学习平台\n')
        f.write('版本号：V1.0\n')
        f.write('页码：第1页 至 第%d页（共%d页）\n' % (len(front_pages), len(front_pages)))
        f.write('每页行数：%d行\n' % LINES_PER_PAGE)
        f.write('总行数：%d行（%d个文件）\n' % (total_lines, file_count))
        f.write('=' * 60 + '\n\n')
        for page_num, page_lines in front_pages:
            f.write('-' * 20 + ' 第 %d 页 ' % page_num + '-' * 20 + '\n')
            for line in page_lines:
                f.write(line + '\n')
            f.write('\n')

    # 2. 后30页
    back_path = None
    back_pages = []
    if actual_back > 0:
        back_start = max(0, total_pages - actual_back)
        back_pages = pages[back_start:]
        back_path = os.path.join(OUTPUT_DIR, '软著源代码_后30页.txt')
        with open(back_path, 'w', encoding='utf-8') as f:
            f.write('软件名称：码上成长Python智能学习平台\n')
            f.write('版本号：V1.0\n')
            f.write('页码：第%d页 至 第%d页（共%d页）\n' % (pages[back_start][0], pages[-1][0], len(back_pages)))
            f.write('每页行数：%d行\n' % LINES_PER_PAGE)
            f.write('总行数：%d行（%d个文件）\n' % (total_lines, file_count))
            f.write('=' * 60 + '\n\n')
            for page_num, page_lines in back_pages:
                f.write('-' * 20 + ' 第 %d 页 ' % page_num + '-' * 20 + '\n')
                for line in page_lines:
                    f.write(line + '\n')
                f.write('\n')

    # 3. 完整版
    full_path = os.path.join(OUTPUT_DIR, '软著源代码_完整版.txt')
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write('软件名称：码上成长Python智能学习平台\n')
        f.write('版本号：V1.0\n')
        f.write('总页数：%d页\n' % total_pages)
        f.write('每页行数：%d行\n' % LINES_PER_PAGE)
        f.write('总行数：%d行（%d个文件）\n' % (total_lines, file_count))
        f.write('=' * 60 + '\n\n')
        for page_num, page_lines in pages:
            f.write('-' * 20 + ' 第 %d 页 ' % page_num + '-' * 20 + '\n')
            for line in page_lines:
                f.write(line + '\n')
            f.write('\n')

    # 4. 页码对照表
    map_path = os.path.join(OUTPUT_DIR, '页码对照表.txt')
    with open(map_path, 'w', encoding='utf-8') as f:
        f.write('软著源代码页码对照表\n')
        f.write('=' * 60 + '\n')
        f.write('总页数：%d，总文件数：%d，总行数：%d\n' % (total_pages, file_count, total_lines))
        f.write('提交要求：前%d页 + 后%d页\n\n' % (FRONT_PAGES, BACK_PAGES))

        current_file = None
        for page_num, page_lines in pages:
            # 从页的第一行找文件名
            file_marker = None
            for line in page_lines[:5]:
                m = re.search(r'文件[::]\s*(.+)', line)
                if m:
                    file_marker = m.group(1).strip()
                    break
                if line.startswith('// 文件:'):
                    file_marker = line.replace('// 文件:', '').strip()
                    break
            if file_marker and file_marker != current_file:
                current_file = file_marker
                f.write('\n  %s -> 起始于第%d页\n' % (current_file, page_num))
            if page_num <= actual_front or (actual_back > 0 and page_num > total_pages - actual_back):
                f.write('    第%d页 [提交]\n' % page_num)
            else:
                f.write('    第%d页\n' % page_num)

    print('')
    print('  OK 源代码提取完成！')
    print('    总文件数：%d' % file_count)
    print('    总代码行数：%d' % total_lines)
    print('    总页数：%d（每页%d行）' % (total_pages, LINES_PER_PAGE))
    print('')
    print('  输出文件：')
    print('    前%d页 -> %s' % (len(front_pages), front_path))
    if back_path:
        print('    后%d页 -> %s' % (len(back_pages), back_path))
    print('    完整版 -> %s' % full_path)
    print('    页码对照表 -> %s' % map_path)
    print('')
    if total_pages < FRONT_PAGES + BACK_PAGES:
        print('  [注意] 总页数（%d）< 60页，将提交全部代码' % total_pages)
    else:
        print('  OK 总页数（%d）>= 60页，按要求提交前30页+后30页' % total_pages)


def main():
    print('正在收集源代码文件...')
    print('  项目目录：%s' % PROJECT_ROOT)
    print('')

    files = collect_source_files()
    if not files:
        print('  ERROR 未找到任何源代码文件，请检查配置！')
        sys.exit(1)

    print('  找到 %d 个源代码文件：' % len(files))
    for rel_path, _ in files:
        print('    - %s' % rel_path)
    print('')

    # 读取所有文件内容
    print('正在读取文件内容...')
    all_lines = []
    total_lines = 0

    for rel_path, abs_path in files:
        lines = read_file_safe(abs_path)
        for i, line in enumerate(lines):
            all_lines.append((line, abs_path, i + 1))
        total_lines += len(lines)

    print('  读取完成，共 %d 行代码' % total_lines)
    print('')

    # 格式化为页码文档
    print('正在格式化页码文档...')
    pages = format_code_document(all_lines)
    print('')

    # 写入输出文件
    write_output_files(pages, total_lines, len(files))


if __name__ == '__main__':
    main()
