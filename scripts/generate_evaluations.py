import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = 'g:/60.PYTHON/Project/mashangchengzhang2/data/mscz.db'

QUESTIONS = [
    "编写程序，输出Hello World。",
    "编写程序，计算两个数之和。",
    "编写程序，输入圆的半径r，计算并输出圆的面积。圆周率取3.14。",
    "编写程序，判断一个数是奇数还是偶数。",
    "编写程序，输入三个整数，找出其中的最大值并输出。",
    "编写程序，输出九九乘法表。",
    "编写程序，计算斐波那契数列的前20项。",
    "编写程序，判断某一年是否为闰年。",
    "编写程序，求1到100的累加和。",
    "编写程序，计算一个数的阶乘。",
    "编写程序，判断一个数是否为素数。",
    "编写程序，将一个列表中的元素反转。",
    "编写程序，统计字符串中每个字符出现的次数。",
    "编写程序，找出列表中的重复元素。",
    "编写程序，计算两个列表的交集。",
]

CODE_TEMPLATES = [
    'print("Hello, World!")',
    'a = 10\nb = 20\nprint(a + b)',
    'r = 5\npi = 3.14\narea = pi * r * r\nprint(area)',
    'num = 7\nif num % 2 == 0:\n    print("偶数")\nelse:\n    print("奇数")',
    'a, b, c = 10, 20, 15\nprint(max(a, b, c))',
]

def generate_report(score):
    if score >= 90:
        level = "优秀"
        hint = "代码质量优秀，继续保持！"
    elif score >= 80:
        level = "良好"
        hint = "代码结构良好，有一些小改进空间。"
    elif score >= 60:
        level = "及格"
        hint = "代码基本正确，需要进一步优化。"
    else:
        level = "待提升"
        hint = "代码存在较多问题，建议复习相关知识点。"
    
    understanding = min(30, round(score * 0.3))
    logic = min(25, round(score * 0.25))
    readability = min(25, round(score * 0.25))
    syntax = min(20, round(score * 0.2))
    
    return {
        "understandingScore": understanding,
        "logicScore": logic,
        "readabilityScore": readability,
        "syntaxScore": syntax,
        "totalScore": score,
        "level": level,
        "hint": hint,
        "practice": "继续练习相关题目",
        "knowledgePoints": ["基础语法", "逻辑思维"]
    }

def generate_evaluations():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT student_id, name FROM students')
    students = cursor.fetchall()
    
    total_records = 0
    
    for student_id, student_name in students:
        print(f"为学生 {student_name} ({student_id}) 生成评价记录...")
        
        records_generated = 0
        questions_used = set()
        
        while records_generated < 8:
            question_idx = random.randint(0, len(QUESTIONS) - 1)
            question = QUESTIONS[question_idx]
            
            code = CODE_TEMPLATES[min(question_idx, len(CODE_TEMPLATES) - 1)]
            
            score = random.randint(60, 98)
            report = generate_report(score)
            
            created_at = (datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))).strftime('%Y-%m-%d %H:%M:%S')
            
            cursor.execute('''
                INSERT INTO evaluations (student_id, question, code, report, score, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (student_id, question, code, str(report), score, created_at))
            
            records_generated += 1
            total_records += 1
            print(f"  生成记录 {records_generated}: 题目{question_idx+1}, 分数: {score}")
            
            if score < 85:
                improved_code = code + "\n# 优化后的代码"
                improved_score = random.randint(90, 100)
                improved_report = generate_report(improved_score)
                improved_created_at = (datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S') + timedelta(hours=random.randint(1, 24))).strftime('%Y-%m-%d %H:%M:%S')
                
                cursor.execute('''
                    INSERT INTO evaluations (student_id, question, code, report, score, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (student_id, question, improved_code, str(improved_report), improved_score, improved_created_at))
                
                records_generated += 1
                total_records += 1
                print(f"  生成改进记录 {records_generated}: 同一题目, 改进后分数: {improved_score}")
        
        conn.commit()
        print(f"  完成！共生成 {records_generated} 条记录\n")
    
    conn.close()
    print(f"全部完成！共为 {len(students)} 名学生生成了 {total_records} 条评价记录")

if __name__ == "__main__":
    generate_evaluations()