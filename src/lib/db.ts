/**
 * SQLite数据库模块
 * 使用better-sqlite3进行数据持久化存储
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'mscz.db');

let db: Database.Database | null = null;

const INITIAL_QUESTIONS = [
  { title: '输出Hello World', content: '编写一个Python程序，输出"Hello World！"。', hint: '使用print()函数可以输出内容到控制台。print函数的括号中放入要输出的字符串即可。', exampleCode: 'print("Hello World!")' },
  { title: '计算两数之和', content: '编写程序，定义两个变量a=10，b=20，计算它们的和并输出结果。', hint: '使用+运算符进行加法运算。定义变量使用赋值符号=，然后用print输出结果。', exampleCode: 'a = 10\nb = 20\nresult = a + b\nprint(result)' },
  { title: '计算圆的面积', content: '编写程序，输入圆的半径r，计算并输出圆的面积。圆周率取3.14。', hint: '圆的面积公式是S = πr²。使用input()函数获取用户输入，注意转换为float类型。', exampleCode: 'r = float(input("请输入圆的半径："))\npi = 3.14\narea = pi * r * r\nprint("圆的面积是：", area)' },
  { title: '判断奇偶性', content: '编写程序，输入一个整数，判断它是奇数还是偶数。', hint: '使用取模运算符%，如果num % 2 == 0则是偶数，否则是奇数。', exampleCode: 'num = int(input("请输入一个整数："))\nif num % 2 == 0:\n    print(num, "是偶数")\nelse:\n    print(num, "是奇数")' },
  { title: '求三个数的最大值', content: '编写程序，输入三个整数，找出其中的最大值并输出。', hint: '可以使用if-elif语句依次比较，或者使用max()函数直接获取最大值。', exampleCode: 'a = int(input("请输入第一个数："))\nb = int(input("请输入第二个数："))\nc = int(input("请输入第三个数："))\nmax_num = max(a, b, c)\nprint("最大值是：", max_num)' },
  { title: '输出九九乘法表', content: '编写程序，输出九九乘法表。', hint: '使用两层for循环，外层控制行数，内层控制列数。注意print的end参数可以控制换行。', exampleCode: 'for i in range(1, 10):\n    for j in range(1, i+1):\n        print(f"{j}x{i}={i*j}", end="\\t")\n    print()' },
  { title: '计算斐波那契数列', content: '编写程序，输出前20个斐波那契数。', hint: '斐波那契数列的规律是：F(1)=1, F(2)=1, F(n)=F(n-1)+F(n-2)。使用循环实现。', exampleCode: 'a, b = 1, 1\nprint(a, b, end=" ")\nfor i in range(3, 21):\n    c = a + b\n    print(c, end=" ")\n    a, b = b, c' },
  { title: '判断闰年', content: '编写程序，输入一个年份，判断它是否是闰年。', hint: '闰年的判断规则：能被4整除但不能被100整除，或者能被400整除。', exampleCode: 'year = int(input("请输入年份："))\nif (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):\n    print(year, "是闰年")\nelse:\n    print(year, "不是闰年")' },
  { title: '统计字符串中的字符数', content: '编写程序，输入一个字符串，统计其中的字母、数字和其他字符的个数。', hint: '遍历字符串的每个字符，使用isalpha()判断字母，isdigit()判断数字。', exampleCode: 's = input("请输入一个字符串：")\nletters = 0\ndigits = 0\nothers = 0\nfor char in s:\n    if char.isalpha():\n        letters += 1\n    elif char.isdigit():\n        digits += 1\n    else:\n        others += 1\nprint(f"字母：{letters}，数字：{digits}，其他：{others}")' },
  { title: '列表逆序', content: '编写程序，将一个列表逆序输出。', hint: '可以使用切片操作[::-1]快速实现列表逆序，或者使用reverse()方法。', exampleCode: 'lst = [1, 2, 3, 4, 5]\nreversed_lst = lst[::-1]\nprint(reversed_lst)' },
  { title: '求平均数', content: '编写程序，输入5个数字，计算它们的平均值。', hint: '使用循环输入5个数，累加求和后除以5得到平均值。', exampleCode: 'total = 0\nfor i in range(5):\n    num = float(input(f"请输入第{i+1}个数："))\n    total += num\naverage = total / 5\nprint("平均值是：", average)' },
  { title: '判断素数', content: '编写程序，输入一个整数，判断它是否是素数。', hint: '素数是大于1的自然数，除了1和它本身没有其他因数。使用循环检查从2到sqrt(n)的数。', exampleCode: 'num = int(input("请输入一个整数："))\nif num <= 1:\n    print(num, "不是素数")\nelif num == 2:\n    print(num, "是素数")\nelse:\n    is_prime = True\n    for i in range(2, int(num**0.5) + 1):\n        if num % i == 0:\n            is_prime = False\n            break\n    print(num, "是素数" if is_prime else "不是素数")' },
  { title: '字符串反转', content: '编写程序，输入一个字符串，将其反转后输出。', hint: '使用切片操作s[::-1]可以快速反转字符串。', exampleCode: 's = input("请输入一个字符串：")\nreversed_s = s[::-1]\nprint("反转后的字符串：", reversed_s)' },
  { title: '计算阶乘', content: '编写程序，输入一个正整数n，计算n的阶乘。', hint: '阶乘的定义：n! = 1 × 2 × 3 × ... × n。可以使用循环或递归实现。', exampleCode: 'n = int(input("请输入一个正整数："))\nresult = 1\nfor i in range(1, n+1):\n    result *= i\nprint(f"{n}的阶乘是：{result}")' },
  { title: '温度转换', content: '编写程序，将华氏温度转换为摄氏温度。公式：C = (F - 32) × 5/9。', hint: '获取用户输入的华氏温度，使用公式进行计算后输出。', exampleCode: 'f = float(input("请输入华氏温度："))\nc = (f - 32) * 5 / 9\nprint(f"摄氏温度是：{c:.2f}")' },
  { title: '列表去重', content: '编写程序，去除列表中的重复元素。', hint: '可以将列表转换为集合（set）自动去重，然后再转换回列表。', exampleCode: 'lst = [1, 2, 2, 3, 3, 3, 4, 5]\nunique_lst = list(set(lst))\nprint("去重后的列表：", unique_lst)' },
  { title: '简单计算器', content: '编写程序，实现简单的加减乘除运算。', hint: '获取用户输入的两个数和运算符，使用if-elif判断运算符类型并计算。', exampleCode: 'a = float(input("请输入第一个数："))\noperator = input("请输入运算符(+,-,*,/)：")\nb = float(input("请输入第二个数："))\nif operator == "+":\n    print(a + b)\nelif operator == "-":\n    print(a - b)\nelif operator == "*":\n    print(a * b)\nelif operator == "/":\n    print(a / b)\nelse:\n    print("无效的运算符")' },
  { title: '输出菱形图案', content: '编写程序，输出一个由*组成的菱形图案。', hint: '使用循环控制行数，每行输出的空格和星号数量需要计算。', exampleCode: 'n = 5\nfor i in range(n):\n    print(" " * (n - i - 1) + "*" * (2 * i + 1))\nfor i in range(n-2, -1, -1):\n    print(" " * (n - i - 1) + "*" * (2 * i + 1))' },
  { title: '字典操作', content: '创建一个学生字典，包含姓名、年龄、成绩，然后输出这些信息。', hint: '字典使用键值对存储数据，格式为{"key": value}。', exampleCode: 'student = {"姓名": "张三", "年龄": 16, "成绩": 95}\nprint("姓名：", student["姓名"])\nprint("年龄：", student["年龄"])\nprint("成绩：", student["成绩"])' },
  { title: '列表排序', content: '编写程序，对一个列表进行升序和降序排序。', hint: '使用sort()方法进行原地排序，或者使用sorted()函数返回新列表。', exampleCode: 'lst = [3, 1, 4, 1, 5, 9, 2, 6]\nasc_lst = sorted(lst)\ndesc_lst = sorted(lst, reverse=True)\nprint("升序：", asc_lst)\nprint("降序：", desc_lst)' },
  { title: '计算平方和', content: '编写程序，计算1到100的平方和。', hint: '使用循环累加每个数的平方值。', exampleCode: 'total = 0\nfor i in range(1, 101):\n    total += i ** 2\nprint("1到100的平方和是：", total)' },
  { title: '查找列表中的最大值', content: '编写程序，手动查找列表中的最大值（不使用max函数）。', hint: '初始化一个变量为列表第一个元素，然后遍历列表进行比较。', exampleCode: 'lst = [3, 7, 2, 9, 5]\nmax_val = lst[0]\nfor num in lst:\n    if num > max_val:\n        max_val = num\nprint("最大值是：", max_val)' },
  { title: '字符串拼接', content: '编写程序，将列表中的字符串拼接成一个完整的句子。', hint: '使用join()方法可以将列表中的字符串连接起来。', exampleCode: 'words = ["Hello", "World", "Python"]\nsentence = " ".join(words)\nprint(sentence)' },
  { title: '计算等差数列', content: '编写程序，输出首项为1，公差为2的前10项等差数列。', hint: '等差数列的通项公式：an = a1 + (n-1)d。', exampleCode: 'a1 = 1\nd = 2\nfor i in range(10):\n    print(a1 + i * d, end=" ")' },
  { title: '列表元素计数', content: '编写程序，统计列表中每个元素出现的次数。', hint: '可以使用字典来记录每个元素的计数。', exampleCode: 'lst = [1, 2, 2, 3, 3, 3, 4]\ncount = {}\nfor num in lst:\n    count[num] = count.get(num, 0) + 1\nprint(count)' },
  { title: '简单密码验证', content: '编写程序，验证密码是否符合要求：至少8位，包含数字和字母。', hint: '使用循环检查每个字符，判断是否包含数字和字母。', exampleCode: 'password = input("请输入密码：")\nhas_num = False\nhas_letter = False\nif len(password) >= 8:\n    for char in password:\n        if char.isdigit():\n            has_num = True\n        elif char.isalpha():\n            has_letter = True\n    if has_num and has_letter:\n        print("密码符合要求")\n    else:\n        print("密码需要包含数字和字母")\nelse:\n    print("密码至少需要8位")' },
  { title: '生成随机数', content: '编写程序，生成10个1到100之间的随机整数。', hint: '使用random模块的randint()函数生成随机整数。', exampleCode: 'import random\nfor i in range(10):\n    print(random.randint(1, 100), end=" ")' },
  { title: '文件读写', content: '编写程序，将字符串写入文件，然后读取并输出。', hint: '使用open()函数打开文件，使用write()写入，read()读取。', exampleCode: 'with open("test.txt", "w") as f:\n    f.write("Hello, Python!")\nwith open("test.txt", "r") as f:\n    content = f.read()\nprint(content)' },
  { title: '计算BMI指数', content: '编写程序，输入身高和体重，计算BMI指数并输出。', hint: 'BMI = 体重(kg) / 身高(m)²。注意单位转换。', exampleCode: 'height = float(input("请输入身高（米）："))\nweight = float(input("请输入体重（公斤）："))\nbmi = weight / (height ** 2)\nprint(f"你的BMI指数是：{bmi:.2f}")' },
  { title: '列表推导式', content: '使用列表推导式生成1到10的平方列表。', hint: '列表推导式的格式：[表达式 for 变量 in 序列]。', exampleCode: 'squares = [i ** 2 for i in range(1, 11)]\nprint(squares)' },
  { title: '递归计算阶乘', content: '使用递归函数计算阶乘。', hint: '递归函数需要有基线条件和递归条件。', exampleCode: 'def factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n-1)\nprint(factorial(5))' },
  { title: '集合操作', content: '编写程序，求两个集合的交集、并集和差集。', hint: '使用set的intersection、union、difference方法。', exampleCode: 'set1 = {1, 2, 3, 4}\nset2 = {3, 4, 5, 6}\nprint("交集：", set1 & set2)\nprint("并集：", set1 | set2)\nprint("差集：", set1 - set2)' },
  { title: '函数参数', content: '定义一个函数，接收两个参数并返回它们的和。', hint: '函数定义使用def关键字，参数放在括号中。', exampleCode: 'def add(a, b):\n    return a + b\nresult = add(3, 5)\nprint(result)' },
  { title: '可变参数', content: '定义一个函数，可以接收任意数量的参数并返回它们的和。', hint: '使用*args接收可变数量的位置参数。', exampleCode: 'def sum_all(*args):\n    total = 0\n    for num in args:\n        total += num\n    return total\nprint(sum_all(1, 2, 3, 4, 5))' },
  { title: 'Lambda函数', content: '使用lambda函数计算两个数的乘积。', hint: 'lambda函数是匿名函数，语法：lambda 参数: 表达式。', exampleCode: 'multiply = lambda a, b: a * b\nprint(multiply(4, 5))' },
  { title: '装饰器', content: '定义一个装饰器，用于打印函数执行时间。', hint: '装饰器是一个接收函数作为参数并返回新函数的函数。', exampleCode: 'import time\ndef timer(func):\n    def wrapper():\n        start = time.time()\n        func()\n        end = time.time()\n        print(f"执行时间：{end - start:.2f}秒")\n    return wrapper\n@timer\ndef say_hello():\n    print("Hello!")\nsay_hello()' },
  { title: '类的定义', content: '定义一个Person类，包含姓名和年龄属性，以及一个介绍方法。', hint: '类定义使用class关键字，__init__方法用于初始化属性。', exampleCode: 'class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    def introduce(self):\n        print(f"我叫{self.name}，今年{self.age}岁")\np = Person("张三", 18)\np.introduce()' },
  { title: '类的继承', content: '定义一个Student类继承自Person类，添加成绩属性。', hint: '子类继承父类时，在类定义时指定父类。', exampleCode: 'class Student(Person):\n    def __init__(self, name, age, score):\n        super().__init__(name, age)\n        self.score = score\n    def show_score(self):\n        print(f"{self.name}的成绩是{self.score}分")\ns = Student("李四", 16, 95)\ns.show_score()' },
  { title: '异常处理', content: '编写程序，捕获除零异常。', hint: '使用try-except语句捕获异常。', exampleCode: 'try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("不能除以零！")' },
  { title: '读取CSV文件', content: '编写程序，读取CSV文件内容并输出。', hint: '可以使用csv模块读取CSV文件。', exampleCode: 'import csv\nwith open("data.csv", "r") as f:\n    reader = csv.reader(f)\n    for row in reader:\n        print(row)' },
  { title: '正则表达式', content: '编写程序，使用正则表达式匹配邮箱地址。', hint: '使用re模块进行正则匹配。', exampleCode: 'import re\nemail = "test@example.com"\npattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\nif re.match(pattern, email):\n    print("有效的邮箱地址")\nelse:\n    print("无效的邮箱地址")' },
  { title: '日期处理', content: '编写程序，获取当前日期并格式化为YYYY-MM-DD。', hint: '使用datetime模块处理日期。', exampleCode: 'from datetime import datetime\nnow = datetime.now()\nprint(now.strftime("%Y-%m-%d"))' },
  { title: '生成器函数', content: '定义一个生成器函数，生成斐波那契数列。', hint: '生成器函数使用yield关键字返回值。', exampleCode: 'def fibonacci():\n    a, b = 0, 1\n    while True:\n        yield b\n        a, b = b, a + b\nfib = fibonacci()\nfor i in range(10):\n    print(next(fib), end=" ")' },
  { title: '迭代器', content: '创建一个自定义迭代器，输出1到10的数字。', hint: '迭代器需要实现__iter__和__next__方法。', exampleCode: 'class MyIterator:\n    def __init__(self):\n        self.num = 1\n    def __iter__(self):\n        return self\n    def __next__(self):\n        if self.num <= 10:\n            result = self.num\n            self.num += 1\n            return result\n        else:\n            raise StopIteration\nfor num in MyIterator():\n    print(num, end=" ")' },
  { title: '模块导入', content: '创建一个简单的模块并导入使用。', hint: '创建一个.py文件作为模块，然后使用import导入。', exampleCode: '# utils.py\ndef add(a, b):\n    return a + b\n\n# main.py\nimport utils\nprint(utils.add(3, 5))' },
  { title: '包的使用', content: '创建一个包并导入其中的模块。', hint: '创建一个包含__init__.py文件的目录作为包。', exampleCode: '# 创建包结构：mypackage/__init__.py, mypackage/module.py\nfrom mypackage import module\nmodule.say_hello()' },
  { title: '文件操作', content: '编写程序，列出指定目录下的所有文件。', hint: '使用os模块的listdir函数。', exampleCode: 'import os\nfiles = os.listdir(".")\nfor file in files:\n    print(file)' },
  { title: '路径操作', content: '编写程序，获取文件的绝对路径。', hint: '使用os.path模块的abspath函数。', exampleCode: 'import os\npath = os.path.abspath("test.txt")\nprint(path)' },
  { title: 'JSON处理', content: '编写程序，将字典转换为JSON字符串并保存到文件。', hint: '使用json模块进行JSON序列化和反序列化。', exampleCode: 'import json\ndata = {"name": "张三", "age": 18}\njson_str = json.dumps(data)\nwith open("data.json", "w") as f:\n    f.write(json_str)' },
  { title: 'XML处理', content: '编写程序，解析XML文件。', hint: '使用xml.etree.ElementTree模块解析XML。', exampleCode: 'import xml.etree.ElementTree as ET\ntree = ET.parse("data.xml")\nroot = tree.getroot()\nfor child in root:\n    print(child.tag, child.text)' },
  { title: 'HTTP请求', content: '编写程序，发送HTTP GET请求。', hint: '使用requests库发送HTTP请求。', exampleCode: 'import requests\nresponse = requests.get("https://www.example.com")\nprint(response.text)' },
  { title: '多线程', content: '编写程序，使用多线程执行任务。', hint: '使用threading模块创建线程。', exampleCode: 'import threading\ndef say_hello():\n    print("Hello from thread!")\nt = threading.Thread(target=say_hello)\nt.start()\nt.join()' },
  { title: '多进程', content: '编写程序，使用多进程执行任务。', hint: '使用multiprocessing模块创建进程。', exampleCode: 'from multiprocessing import Process\ndef say_hello():\n    print("Hello from process!")\np = Process(target=say_hello)\np.start()\np.join()' },
  { title: '队列', content: '使用队列实现生产者消费者模式。', hint: '使用queue模块的Queue类。', exampleCode: 'from queue import Queue\nq = Queue()\nq.put(1)\nq.put(2)\nprint(q.get())\nprint(q.get())' },
  { title: '栈', content: '使用列表实现栈数据结构。', hint: '栈是后进先出（LIFO）的数据结构。', exampleCode: 'stack = []\nstack.append(1)\nstack.append(2)\nstack.append(3)\nprint(stack.pop())\nprint(stack.pop())' },
  { title: '队列实现', content: '使用列表实现队列数据结构。', hint: '队列是先进先出（FIFO）的数据结构。', exampleCode: 'queue = []\nqueue.append(1)\nqueue.append(2)\nqueue.append(3)\nprint(queue.pop(0))\nprint(queue.pop(0))' },
  { title: '二叉树', content: '定义一个二叉树节点类。', hint: '二叉树节点包含值、左子节点和右子节点。', exampleCode: 'class TreeNode:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\nroot = TreeNode(1)\nroot.left = TreeNode(2)\nroot.right = TreeNode(3)' },
  { title: '图的表示', content: '使用邻接表表示图。', hint: '图可以使用字典来表示，键是节点，值是相邻节点列表。', exampleCode: 'graph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D"],\n    "D": ["B", "C"]\n}\nprint(graph["A"])' },
  { title: '深度优先搜索', content: '实现图的深度优先搜索。', hint: '使用递归或栈实现DFS。', exampleCode: 'def dfs(graph, node, visited):\n    if node not in visited:\n        print(node)\n        visited.add(node)\n        for neighbor in graph[node]:\n            dfs(graph, neighbor, visited)\ngraph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}\ndfs(graph, "A", set())' },
  { title: '广度优先搜索', content: '实现图的广度优先搜索。', hint: '使用队列实现BFS。', exampleCode: 'from collections import deque\ndef bfs(graph, start):\n    visited = set()\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        if node not in visited:\n            print(node)\n            visited.add(node)\n            queue.extend(graph[node])\ngraph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}\nbfs(graph, "A")' },
  { title: '二分查找', content: '实现二分查找算法。', hint: '二分查找要求数组已经排序。', exampleCode: 'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\narr = [1, 3, 5, 7, 9]\nprint(binary_search(arr, 5))' },
  { title: '冒泡排序', content: '实现冒泡排序算法。', hint: '冒泡排序通过相邻元素比较交换进行排序。', exampleCode: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\nprint(bubble_sort([3, 1, 4, 1, 5]))' },
  { title: '选择排序', content: '实现选择排序算法。', hint: '选择排序每次选择最小的元素放到已排序部分。', exampleCode: 'def selection_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        min_idx = i\n        for j in range(i + 1, n):\n            if arr[j] < arr[min_idx]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]\n    return arr\nprint(selection_sort([64, 25, 12, 22, 11]))' },
  { title: '插入排序', content: '实现插入排序算法。', hint: '插入排序将元素插入到已排序部分的正确位置。', exampleCode: 'def insertion_sort(arr):\n    for i in range(1, len(arr)):\n        key = arr[i]\n        j = i - 1\n        while j >= 0 and key < arr[j]:\n            arr[j + 1] = arr[j]\n            j -= 1\n        arr[j + 1] = key\n    return arr\nprint(insertion_sort([12, 11, 13, 5, 6]))' },
  { title: '快速排序', content: '实现快速排序算法。', hint: '快速排序使用分治策略，选择基准元素进行分区。', exampleCode: 'def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\nprint(quick_sort([3, 6, 8, 10, 1, 2, 1]))' },
  { title: '归并排序', content: '实现归并排序算法。', hint: '归并排序使用分治策略，将数组分成两半分别排序后合并。', exampleCode: 'def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\ndef merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] < right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result\nprint(merge_sort([12, 11, 13, 5, 6, 7]))' },
  { title: '堆排序', content: '实现堆排序算法。', hint: '堆排序使用堆数据结构进行排序。', exampleCode: 'def heapify(arr, n, i):\n    largest = i\n    l = 2 * i + 1\n    r = 2 * i + 2\n    if l < n and arr[i] < arr[l]:\n        largest = l\n    if r < n and arr[largest] < arr[r]:\n        largest = r\n    if largest != i:\n        arr[i], arr[largest] = arr[largest], arr[i]\n        heapify(arr, n, largest)\ndef heap_sort(arr):\n    n = len(arr)\n    for i in range(n // 2 - 1, -1, -1):\n        heapify(arr, n, i)\n    for i in range(n - 1, 0, -1):\n        arr[i], arr[0] = arr[0], arr[i]\n        heapify(arr, i, 0)\n    return arr\nprint(heap_sort([12, 11, 13, 5, 6, 7]))' },
  { title: '动态规划', content: '使用动态规划计算斐波那契数列。', hint: '动态规划使用备忘录存储已计算的结果。', exampleCode: 'def fibonacci(n):\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]\n    return dp[n]\nprint(fibonacci(10))' },
  { title: '贪心算法', content: '使用贪心算法找零钱。', hint: '贪心算法每次选择最大面额的硬币。', exampleCode: 'def make_change(amount, coins):\n    coins.sort(reverse=True)\n    count = 0\n    for coin in coins:\n        while amount >= coin:\n            amount -= coin\n            count += 1\n    return count\nprint(make_change(28, [25, 10, 5, 1]))' },
  { title: '回溯算法', content: '使用回溯算法解决八皇后问题。', hint: '回溯算法尝试所有可能的解决方案。', exampleCode: 'def solve_n_queens(n):\n    def is_safe(board, row, col):\n        for i in range(row):\n            if board[i] == col or abs(i - row) == abs(board[i] - col):\n                return False\n        return True\n    def backtrack(row):\n        if row == n:\n            result.append(board[:])\n            return\n        for col in range(n):\n            if is_safe(board, row, col):\n                board[row] = col\n                backtrack(row + 1)\n                board[row] = -1\n    result = []\n    board = [-1] * n\n    backtrack(0)\n    return result\nprint(len(solve_n_queens(8)))' },
  { title: '位运算', content: '编写程序，交换两个整数的奇偶位。', hint: '使用位运算符进行操作。', exampleCode: 'def swap_odd_even_bits(n):\n    even_bits = n & 0xAAAAAAAA\n    odd_bits = n & 0x55555555\n    even_bits >>= 1\n    odd_bits <<= 1\n    return even_bits | odd_bits\nprint(swap_odd_even_bits(23))' },
  { title: '内存管理', content: '编写程序，查看对象占用的内存大小。', hint: '使用sys模块的getsizeof函数。', exampleCode: 'import sys\nlst = [1, 2, 3, 4, 5]\nprint(f"列表占用内存：{sys.getsizeof(lst)}字节")' },
  { title: '性能测试', content: '编写程序，测试函数执行时间。', hint: '使用time模块进行计时。', exampleCode: 'import time\ndef test_function():\n    total = 0\n    for i in range(1000000):\n        total += i\n    return total\nstart = time.time()\ntest_function()\nend = time.time()\nprint(f"执行时间：{end - start:.4f}秒")' },
  { title: '调试技巧', content: '编写程序，使用assert语句进行调试。', hint: 'assert语句用于检查条件是否为真。', exampleCode: 'def divide(a, b):\n    assert b != 0, "除数不能为零"\n    return a / b\nprint(divide(10, 2))\nprint(divide(10, 0))' },
  { title: '日志记录', content: '编写程序，使用logging模块记录日志。', hint: 'logging模块提供了灵活的日志记录功能。', exampleCode: 'import logging\nlogging.basicConfig(level=logging.DEBUG)\nlogging.debug("调试信息")\nlogging.info("普通信息")\nlogging.warning("警告信息")\nlogging.error("错误信息")' },
  { title: '命令行参数', content: '编写程序，获取命令行参数。', hint: '使用sys模块的argv列表。', exampleCode: 'import sys\nprint("命令行参数：", sys.argv)\nprint("参数数量：", len(sys.argv))' },
  { title: '环境变量', content: '编写程序，获取环境变量。', hint: '使用os模块的environ字典。', exampleCode: 'import os\nprint("PATH环境变量：", os.environ.get("PATH"))' },
  { title: '随机数生成', content: '编写程序，生成指定范围内的随机浮点数。', hint: '使用random模块的uniform函数。', exampleCode: 'import random\nprint(random.uniform(0, 1))\nprint(random.uniform(10, 20))' },
  { title: '字符串格式化', content: '使用f-string格式化字符串。', hint: 'f-string是Python 3.6+的特性，使用花括号插入变量。', exampleCode: 'name = "张三"\nage = 18\nprint(f"我叫{name}，今年{age}岁")' },
  { title: '列表操作', content: '编写程序，合并两个列表并去重。', hint: '使用+运算符合并列表，使用set去重。', exampleCode: 'lst1 = [1, 2, 3]\nlst2 = [3, 4, 5]\nmerged = list(set(lst1 + lst2))\nprint(merged)' },
  { title: '字典推导式', content: '使用字典推导式创建字典。', hint: '字典推导式的格式：{key: value for 变量 in 序列}。', exampleCode: 'squares = {i: i ** 2 for i in range(1, 6)}\nprint(squares)' },
  { title: '集合推导式', content: '使用集合推导式创建集合。', hint: '集合推导式的格式：{表达式 for 变量 in 序列}。', exampleCode: 'even_nums = {i for i in range(1, 11) if i % 2 == 0}\nprint(even_nums)' },
  { title: '文件路径', content: '编写程序，拼接文件路径。', hint: '使用os.path模块的join函数。', exampleCode: 'import os\npath = os.path.join("home", "user", "documents", "test.txt")\nprint(path)' },
  { title: '文件大小', content: '编写程序，获取文件大小。', hint: '使用os.path模块的getsize函数。', exampleCode: 'import os\nsize = os.path.getsize("test.txt")\nprint(f"文件大小：{size}字节")' },
  { title: '文件时间', content: '编写程序，获取文件的修改时间。', hint: '使用os.path模块的getmtime函数。', exampleCode: 'import os\nimport time\nmtime = os.path.getmtime("test.txt")\nprint(f"修改时间：{time.ctime(mtime)}")' },
  { title: '目录创建', content: '编写程序，创建目录。', hint: '使用os模块的mkdir函数。', exampleCode: 'import os\nos.mkdir("new_directory")' },
  { title: '目录删除', content: '编写程序，删除目录。', hint: '使用os模块的rmdir函数。', exampleCode: 'import os\nos.rmdir("new_directory")' },
  { title: '文件重命名', content: '编写程序，重命名文件。', hint: '使用os模块的rename函数。', exampleCode: 'import os\nos.rename("old.txt", "new.txt")' },
  { title: '文件删除', content: '编写程序，删除文件。', hint: '使用os模块的remove函数。', exampleCode: 'import os\nos.remove("test.txt")' },
  { title: '字符串查找', content: '编写程序，查找字符串中某个子串的位置。', hint: '使用字符串的find()方法。', exampleCode: 's = "Hello, World!"\nindex = s.find("World")\nprint("子串位置：", index)' },
  { title: '列表合并', content: '编写程序，合并两个列表。', hint: '使用+运算符或extend()方法。', exampleCode: 'list1 = [1, 2, 3]\nlist2 = [4, 5, 6]\nmerged = list1 + list2\nprint(merged)' },
  { title: '字典遍历', content: '编写程序，遍历字典的键值对。', hint: '使用items()方法遍历字典。', exampleCode: 'student = {"name": "张三", "age": 18}\nfor key, value in student.items():\n    print(key, ":", value)' },
  { title: '集合运算', content: '编写程序，计算两个集合的对称差集。', hint: '使用^运算符或symmetric_difference方法。', exampleCode: 'set1 = {1, 2, 3}\nset2 = {3, 4, 5}\nresult = set1 ^ set2\nprint("对称差集：", result)' },
  { title: '函数递归', content: '使用递归函数计算阶乘。', hint: '递归函数需要有基线条件和递归条件。', exampleCode: 'def factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n-1)\nprint(factorial(5))' },
  { title: '模块导入', content: '编写程序，导入math模块并计算平方根。', hint: '使用import语句导入模块。', exampleCode: 'import math\nresult = math.sqrt(16)\nprint("平方根：", result)' },
  { title: '异常处理', content: '编写程序，捕获多种类型的异常。', hint: '可以使用多个except子句捕获不同类型的异常。', exampleCode: 'try:\n    num = int(input("请输入数字："))\n    result = 10 / num\nexcept ValueError:\n    print("请输入有效的数字")\nexcept ZeroDivisionError:\n    print("不能除以零")' },
  { title: '文件读写', content: '编写程序，逐行读取文件内容。', hint: '使用readlines()方法或for循环逐行读取。', exampleCode: 'with open("test.txt", "r") as f:\n    for line in f:\n        print(line.strip())' },
  { title: '日期计算', content: '编写程序，计算两个日期之间的天数差。', hint: '使用datetime模块计算日期差。', exampleCode: 'from datetime import date\nd1 = date(2024, 1, 1)\nd2 = date(2024, 12, 31)\ndays = (d2 - d1).days\nprint("天数差：", days)' },
  { title: '随机数排序', content: '编写程序，生成10个随机数并排序。', hint: '使用random模块生成随机数，使用sort()方法排序。', exampleCode: 'import random\nnums = [random.randint(1, 100) for _ in range(10)]\nnums.sort()\nprint("排序后的列表：", nums)' },
  { title: '命令行参数', content: '编写程序，获取并打印命令行参数。', hint: '使用sys模块的argv列表。', exampleCode: 'import sys\nprint("命令行参数：", sys.argv)' },
];

/**
 * 获取数据库连接（单例模式）
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables(db);
  }
  return db;
}

/**
 * 初始化数据库表结构
 */
function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      question TEXT NOT NULL,
      code TEXT NOT NULL,
      report TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      hint TEXT,
      example_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      user_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(conversation_id)
    );
  `);

  const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin').get() as { count: number };
  if (adminExists.count === 0) {
    db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('myj', '123456');
  }

  const questionsExists = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
  if (questionsExists.count === 0) {
    const insert = db.prepare('INSERT INTO questions (title, content, hint, example_code) VALUES (?, ?, ?, ?)');
    const insertMany = db.transaction((items: typeof INITIAL_QUESTIONS) => {
      for (const item of items) {
        insert.run(item.title, item.content, item.hint, item.exampleCode);
      }
    });
    insertMany(INITIAL_QUESTIONS);
  }

  const studentsExists = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
  if (studentsExists.count === 0) {
    const initialStudents = [
      { studentId: '01', name: '蔡奕睿', className: '计算机应用YB26', password: '123456' },
      { studentId: '02', name: '蔡育韩', className: '计算机应用YB26', password: '123456' },
      { studentId: '03', name: '陈港润', className: '计算机应用YB26', password: '123456' },
      { studentId: '04', name: '陈锴泺', className: '计算机应用YB26', password: '123456' },
      { studentId: '05', name: '陈乐', className: '计算机应用YB26', password: '123456' },
      { studentId: '06', name: '陈埼隆', className: '计算机应用YB26', password: '123456' },
      { studentId: '07', name: '陈少洪', className: '计算机应用YB26', password: '123456' },
      { studentId: '08', name: '陈昕炜', className: '计算机应用YB26', password: '123456' },
      { studentId: '09', name: '陈奕彬', className: '计算机应用YB26', password: '123456' },
      { studentId: '10', name: '陈宇勋', className: '计算机应用YB26', password: '123456' },
      { studentId: '41', name: '程赛', className: '计算机应用YB26', password: '123456' },
      { studentId: '42', name: '韩泽凯', className: '计算机应用YB26', password: '123456' },
      { studentId: '43', name: '何锡洲', className: '计算机应用YB26', password: '123456' },
      { studentId: '44', name: '胡洽恺', className: '计算机应用YB26', password: '123456' },
      { studentId: '15', name: '黄锋栊', className: '计算机应用YB26', password: '123456' },
      { studentId: '16', name: '黄洪斌', className: '计算机应用YB26', password: '123456' },
      { studentId: '17', name: '黄佳韩', className: '计算机应用YB26', password: '123456' },
      { studentId: '18', name: '黄佳桐', className: '计算机应用YB26', password: '123456' },
      { studentId: '20', name: '纪仲毫', className: '计算机应用YB26', password: '123456' },
      { studentId: '22', name: '李定文', className: '计算机应用YB26', password: '123456' },
      { studentId: '23', name: '李利顺', className: '计算机应用YB26', password: '123456' },
      { studentId: '24', name: '连亨展', className: '计算机应用YB26', password: '123456' },
      { studentId: '25', name: '梁诚贤', className: '计算机应用YB26', password: '123456' },
      { studentId: '26', name: '林佳豪', className: '计算机应用YB26', password: '123456' },
      { studentId: '27', name: '林坚昊', className: '计算机应用YB26', password: '123456' },
      { studentId: '28', name: '林沛明', className: '计算机应用YB26', password: '123456' },
      { studentId: '29', name: '王锶越', className: '计算机应用YB26', password: '123456' },
      { studentId: '30', name: '王炜', className: '计算机应用YB26', password: '123456' },
      { studentId: '31', name: '王泽锋', className: '计算机应用YB26', password: '123456' },
      { studentId: '32', name: '谢哲锋', className: '计算机应用YB26', password: '123456' },
      { studentId: '34', name: '许佳凯', className: '计算机应用YB26', password: '123456' },
      { studentId: '35', name: '杨佳思', className: '计算机应用YB26', password: '123456' },
      { studentId: '36', name: '叶颖晗', className: '计算机应用YB26', password: '123456' },
      { studentId: '38', name: '张榆海', className: '计算机应用YB26', password: '123456' },
      { studentId: '39', name: '朱桂坤', className: '计算机应用YB26', password: '123456' },
      { studentId: '40', name: '庄启源', className: '计算机应用YB26', password: '123456' },
      { studentId: '45', name: '黄惠燕', className: '计算机应用YB26', password: '123456' },
      { studentId: '46', name: '黄遂娟', className: '计算机应用YB26', password: '123456' },
      { studentId: '47', name: '王雪莲', className: '计算机应用YB26', password: '123456' },
    ];
    const insertStudent = db.prepare('INSERT INTO students (student_id, name, class, password) VALUES (?, ?, ?, ?)');
    const insertStudents = db.transaction((students: typeof initialStudents) => {
      for (const student of students) {
        insertStudent.run(student.studentId, student.name, student.className, student.password);
      }
    });
    insertStudents(initialStudents);
  }
}

/**
 * 初始化数据库（用于服务器启动时调用）
 */
export async function initDb(): Promise<void> {
  getDatabase();
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/* ========== 管理员操作 ========== */

export interface Admin {
  username: string;
  password: string;
}

export function getAdmin(): Admin | null {
  const db = getDatabase();
  const row = db.prepare('SELECT username, password FROM admin LIMIT 1').get() as Admin | undefined;
  return row || null;
}

export function validateAdminLogin(username: string, password: string): boolean {
  const admin = getAdmin();
  return admin !== null && admin.username === username && admin.password === password;
}

export function updateAdminPassword(username: string, newPassword: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE admin SET password = ? WHERE username = ?').run(newPassword, username);
  return result.changes > 0;
}

/* ========== 学生操作 ========== */

export interface Student {
  id: number;
  studentId: string;
  name: string;
  class: string;
  password: string;
  createdAt: string;
}

export function getStudents(): Student[] {
  const db = getDatabase();
  return db.prepare('SELECT id, student_id as studentId, name, class, password, created_at as createdAt FROM students ORDER BY created_at DESC').all() as Student[];
}

export function getStudentById(studentId: string): Student | null {
  const db = getDatabase();
  const row = db.prepare('SELECT id, student_id as studentId, name, class, password, created_at as createdAt FROM students WHERE student_id = ?').get(studentId) as Student | undefined;
  return row || null;
}

export function addStudent(student: { studentId: string; name: string; class: string; password: string }): Student {
  const db = getDatabase();
  const result = db.prepare('INSERT INTO students (student_id, name, class, password) VALUES (?, ?, ?, ?)').run(student.studentId, student.name, student.class, student.password);
  return {
    id: result.lastInsertRowid as number,
    ...student,
    createdAt: new Date().toISOString(),
  };
}

export function addStudentsBatch(students: { studentId: string; name: string; class: string; password: string }[]): number {
  const db = getDatabase();
  const insert = db.prepare('INSERT OR IGNORE INTO students (student_id, name, class, password) VALUES (?, ?, ?, ?)');
  const insertMany = db.transaction((items: { studentId: string; name: string; class: string; password: string }[]) => {
    for (const item of items) {
      insert.run(item.studentId, item.name, item.class, item.password);
    }
  });
  insertMany(students);
  return students.length;
}

export function updateStudent(id: number, data: { studentId?: string; name?: string; class?: string; password?: string }): boolean {
  const db = getDatabase();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  
  if (data.studentId) { fields.push('student_id = ?'); values.push(data.studentId); }
  if (data.name) { fields.push('name = ?'); values.push(data.name); }
  if (data.class) { fields.push('class = ?'); values.push(data.class); }
  if (data.password) { fields.push('password = ?'); values.push(data.password); }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  const result = db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteStudent(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
  return result.changes > 0;
}

export function validateStudentLogin(studentId: string, password: string): Student | null {
  const db = getDatabase();
  const row = db.prepare('SELECT id, student_id as studentId, name, class, password, created_at as createdAt FROM students WHERE student_id = ? AND password = ?').get(studentId, password) as Student | undefined;
  return row || null;
}

/* ========== 学情记录操作 ========== */

export interface EvaluationRecord {
  id: number;
  studentId: string;
  question: string;
  code: string;
  report: string;
  score: number;
  createdAt: string;
}

export function getEvaluations(): EvaluationRecord[] {
  const db = getDatabase();
  return db.prepare('SELECT id, student_id as studentId, question, code, report, score, created_at as createdAt FROM evaluations ORDER BY created_at DESC').all() as EvaluationRecord[];
}

export function getStudentEvaluations(studentId: string): EvaluationRecord[] {
  const db = getDatabase();
  return db.prepare('SELECT id, student_id as studentId, question, code, report, score, created_at as createdAt FROM evaluations WHERE student_id = ? ORDER BY created_at DESC').all(studentId) as EvaluationRecord[];
}

export function addEvaluation(record: { studentId: string; question: string; code: string; report: string; score: number }): EvaluationRecord {
  const db = getDatabase();
  const result = db.prepare('INSERT INTO evaluations (student_id, question, code, report, score) VALUES (?, ?, ?, ?, ?)').run(record.studentId, record.question, record.code, record.report, record.score);
  return {
    id: result.lastInsertRowid as number,
    ...record,
    createdAt: new Date().toISOString(),
  };
}

export function updateEvaluation(id: number, data: { question?: string; code?: string; report?: string; score?: number }): boolean {
  const db = getDatabase();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  
  if (data.question) { fields.push('question = ?'); values.push(data.question); }
  if (data.code) { fields.push('code = ?'); values.push(data.code); }
  if (data.report) { fields.push('report = ?'); values.push(data.report); }
  if (data.score !== undefined) { fields.push('score = ?'); values.push(data.score); }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  const result = db.prepare(`UPDATE evaluations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteEvaluation(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM evaluations WHERE id = ?').run(id);
  return result.changes > 0;
}

/* ========== 题库操作 ========== */

export interface QuestionItem {
  id: number;
  title: string;
  content: string;
  hint: string;
  exampleCode: string;
}

export function getQuestions(): QuestionItem[] {
  const db = getDatabase();
  return db.prepare('SELECT id, title, content, hint, example_code as exampleCode FROM questions ORDER BY id DESC').all() as QuestionItem[];
}

export function addQuestion(question: { title: string; content: string; hint: string; exampleCode: string }): QuestionItem {
  const db = getDatabase();
  const result = db.prepare('INSERT INTO questions (title, content, hint, example_code) VALUES (?, ?, ?, ?)').run(question.title, question.content, question.hint, question.exampleCode);
  return {
    id: result.lastInsertRowid as number,
    ...question,
  };
}

export function updateQuestion(id: number, data: { title?: string; content?: string; hint?: string; exampleCode?: string }): boolean {
  const db = getDatabase();
  const fields: string[] = [];
  const values: string[] = [];
  
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.content) { fields.push('content = ?'); values.push(data.content); }
  if (data.hint) { fields.push('hint = ?'); values.push(data.hint); }
  if (data.exampleCode) { fields.push('example_code = ?'); values.push(data.exampleCode); }
  
  if (fields.length === 0) return false;
  
  values.push(id.toString());
  const result = db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteQuestion(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  return result.changes > 0;
}

/* ========== Session操作 ========== */

export interface Session {
  id: number;
  sessionId: string;
  userType: 'admin' | 'student';
  userId: string;
  createdAt: string;
}

export function createSession(userType: 'admin' | 'student', userId: string): string {
  const db = getDatabase();
  const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  db.prepare('INSERT INTO sessions (session_id, user_type, user_id) VALUES (?, ?, ?)').run(sessionId, userType, userId);
  return sessionId;
}

export function getSession(sessionId: string): Session | null {
  const db = getDatabase();
  const row = db.prepare('SELECT id, session_id as sessionId, user_type as userType, user_id as userId, created_at as createdAt FROM sessions WHERE session_id = ?').get(sessionId) as Session | undefined;
  return row || null;
}

export function deleteSession(sessionId: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
  return result.changes > 0;
}

export function clearOldSessions(): void {
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE created_at < datetime("now", "-7 days", "localtime")').run();
}

/**
 * 获取统计数据摘要
 */
export function getStatistics() {
  const db = getDatabase();
  const records = db.prepare(`
    SELECT 
      COUNT(*) as totalCount,
      COALESCE(AVG(total_score), 0) as avgScore,
      COALESCE(SUM(CASE WHEN total_score >= 85 THEN 1 ELSE 0 END), 0) as excellentCount,
      COALESCE(SUM(CASE WHEN total_score >= 70 AND total_score < 85 THEN 1 ELSE 0 END), 0) as goodCount,
      COALESCE(SUM(CASE WHEN total_score >= 60 AND total_score < 70 THEN 1 ELSE 0 END), 0) as passCount,
      COALESCE(SUM(CASE WHEN total_score < 60 THEN 1 ELSE 0 END), 0) as failCount
    FROM evaluations
  `).get() as any;

  return {
    totalCount: records?.totalCount || 0,
    avgScore: records?.avgScore || 0,
    excellentCount: records?.excellentCount || 0,
    goodCount: records?.goodCount || 0,
    passCount: records?.passCount || 0,
    failCount: records?.failCount || 0,
    excellentRate: records?.totalCount > 0 ? (records.excellentCount / records.totalCount * 100) : 0,
  };
}

/**
 * 获取所有评价记录（带学生姓名）
 */
export function getAllRecords() {
  const db = getDatabase();
  const records = db.prepare(`
    SELECT 
      e.*,
      s.name as student_name,
      s.class as student_class
    FROM evaluations e
    LEFT JOIN students s ON e.student_id = s.student_id
    ORDER BY e.created_at DESC
  `).all();
  return records;
}

/**
 * 搜索评价记录
 */
export function searchRecords(params: {
  studentName?: string | null;
  studentClass?: string | null;
  knowledgePoint?: string | null;
  minScore?: number;
  maxScore?: number;
}) {
  const db = getDatabase();
  let sql = `
    SELECT 
      e.*,
      s.name as student_name,
      s.class as student_class
    FROM evaluations e
    LEFT JOIN students s ON e.student_id = s.student_id
    WHERE 1=1
  `;
  const values: any[] = [];

  if (params.studentName) {
    sql += ' AND s.name LIKE ?';
    values.push(`%${params.studentName}%`);
  }
  if (params.studentClass) {
    sql += ' AND s.class = ?';
    values.push(params.studentClass);
  }
  if (params.knowledgePoint) {
    sql += ' AND e.report LIKE ?';
    values.push(`%${params.knowledgePoint}%`);
  }
  if (typeof params.minScore === 'number') {
    sql += ' AND e.score >= ?';
    values.push(params.minScore);
  }
  if (typeof params.maxScore === 'number') {
    sql += ' AND e.score <= ?';
    values.push(params.maxScore);
  }
  sql += ' ORDER BY e.created_at DESC';
  return db.prepare(sql).all(...values);
}

/**
 * 获取知识点统计
 */
export function getKnowledgePointsStats() {
  const db = getDatabase();
  const records = db.prepare('SELECT hint FROM evaluations').all() as { hint: string }[];
  const kpCount: Record<string, number> = {};

  records.forEach((record: { hint: string }) => {
    if (record.hint) {
      const words = record.hint.split(/[,，、；;]/).filter(w => w.trim().length > 0);
      words.forEach(word => {
        const cleanWord = word.trim();
        if (cleanWord.length > 0) {
          kpCount[cleanWord] = (kpCount[cleanWord] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(kpCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取所有学生姓名
 */
export function getAllStudentNames() {
  const db = getDatabase();
  const records = db.prepare('SELECT DISTINCT name, class FROM students ORDER BY class, name').all() as { name: string; class: string }[];
  return records;
}

/* ========== AI聊天会话操作 ========== */

export interface ChatConversation {
  id: number;
  conversationId: string;
  studentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/**
 * 创建新的聊天会话
 */
export function createChatConversation(studentId: string, title: string): ChatConversation {
  const db = getDatabase();
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const result = db
    .prepare('INSERT INTO chat_conversations (conversation_id, student_id, title) VALUES (?, ?, ?)')
    .run(conversationId, studentId, title);
  return {
    id: result.lastInsertRowid as number,
    conversationId,
    studentId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 获取学生的所有聊天会话
 */
export function getChatConversations(studentId: string): ChatConversation[] {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT id, conversation_id as conversationId, student_id as studentId, title, created_at as createdAt, updated_at as updatedAt FROM chat_conversations WHERE student_id = ? ORDER BY updated_at DESC'
    )
    .all(studentId) as ChatConversation[];
}

/**
 * 获取单个聊天会话
 */
export function getChatConversation(conversationId: string): ChatConversation | null {
  const db = getDatabase();
  const row = db
    .prepare(
      'SELECT id, conversation_id as conversationId, student_id as studentId, title, created_at as createdAt, updated_at as updatedAt FROM chat_conversations WHERE conversation_id = ?'
    )
    .get(conversationId) as ChatConversation | undefined;
  return row || null;
}

/**
 * 更新会话标题
 */
export function updateChatConversationTitle(conversationId: string, title: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare("UPDATE chat_conversations SET title = ?, updated_at = datetime('now', 'localtime') WHERE conversation_id = ?")
    .run(title, conversationId);
  return result.changes > 0;
}

/**
 * 更新会话时间
 */
export function touchChatConversation(conversationId: string): void {
  const db = getDatabase();
  db
    .prepare("UPDATE chat_conversations SET updated_at = datetime('now', 'localtime') WHERE conversation_id = ?")
    .run(conversationId);
}

/**
 * 删除聊天会话
 */
export function deleteChatConversation(conversationId: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM chat_conversations WHERE conversation_id = ?')
    .run(conversationId);
  return result.changes > 0;
}

/**
 * 添加聊天消息
 */
export function addChatMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): ChatMessage {
  const db = getDatabase();
  const result = db
    .prepare('INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, ?, ?)')
    .run(conversationId, role, content);
  // 更新会话时间
  touchChatConversation(conversationId);
  return {
    id: result.lastInsertRowid as number,
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 获取会话的所有消息
 */
export function getChatMessages(conversationId: string): ChatMessage[] {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT id, conversation_id as conversationId, role, content, created_at as createdAt FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC'
    )
    .all(conversationId) as ChatMessage[];
}

/**
 * 删除会话的所有消息
 */
export function deleteChatMessages(conversationId: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM chat_messages WHERE conversation_id = ?')
    .run(conversationId);
  return result.changes > 0;
}