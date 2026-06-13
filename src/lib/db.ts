import sqlite3 from 'sqlite3';

const sqlite = new sqlite3.Database('./data/evaluations.db');

export async function initDb() {
  return new Promise<void>((resolve, reject) => {
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS evaluation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        question TEXT NOT NULL,
        code TEXT NOT NULL,
        understanding_score INTEGER NOT NULL,
        logic_score INTEGER NOT NULL,
        readability_score INTEGER NOT NULL,
        syntax_score INTEGER NOT NULL,
        total_score INTEGER NOT NULL,
        level TEXT NOT NULL,
        hint TEXT,
        practice TEXT,
        knowledge_points TEXT,
        created_at TEXT NOT NULL
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function insertRecord(record: {
  studentName: string;
  question: string;
  code: string;
  understandingScore: number;
  logicScore: number;
  readabilityScore: number;
  syntaxScore: number;
  totalScore: number;
  level: string;
  hint?: string;
  practice?: string;
  knowledgePoints: string[];
  createdAt: string;
}) {
  return new Promise<void>((resolve, reject) => {
    sqlite.run(
      `INSERT INTO evaluation_records (
        student_name, question, code, understanding_score, logic_score,
        readability_score, syntax_score, total_score, level, hint,
        practice, knowledge_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.studentName,
        record.question,
        record.code,
        record.understandingScore,
        record.logicScore,
        record.readabilityScore,
        record.syntaxScore,
        record.totalScore,
        record.level,
        record.hint || null,
        record.practice || null,
        JSON.stringify(record.knowledgePoints || []),
        record.createdAt,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function getAllRecords() {
  return new Promise((resolve, reject) => {
    sqlite.all('SELECT * FROM evaluation_records ORDER BY created_at DESC', (err, rows) => {
      if (err) reject(err);
      else {
        const records = rows.map((row: any) => ({
          ...row,
          knowledgePoints: row.knowledge_points ? JSON.parse(row.knowledge_points) : [],
        }));
        resolve(records);
      }
    });
  });
}

export async function getStatistics() {
  return new Promise((resolve, reject) => {
    sqlite.all(`
      SELECT 
        COUNT(*) as totalCount,
        AVG(total_score) as avgScore,
        SUM(CASE WHEN total_score >= 85 THEN 1 ELSE 0 END) as excellentCount,
        SUM(CASE WHEN total_score >= 70 AND total_score < 85 THEN 1 ELSE 0 END) as goodCount,
        SUM(CASE WHEN total_score >= 60 AND total_score < 70 THEN 1 ELSE 0 END) as passCount,
        SUM(CASE WHEN total_score < 60 THEN 1 ELSE 0 END) as failCount
      FROM evaluation_records
    `, (err, rows) => {
      if (err) reject(err);
      else {
        const stats = rows[0] as any;
        resolve({
          totalCount: Number(stats.totalCount) || 0,
          avgScore: Number(stats.avgScore) || 0,
          excellentCount: Number(stats.excellentCount) || 0,
          goodCount: Number(stats.goodCount) || 0,
          passCount: Number(stats.passCount) || 0,
          failCount: Number(stats.failCount) || 0,
          excellentRate: stats.totalCount ? ((stats.excellentCount / stats.totalCount) * 100) : 0,
        });
      }
    });
  });
}

export async function getKnowledgePointsStats() {
  return new Promise((resolve, reject) => {
    sqlite.all('SELECT knowledge_points FROM evaluation_records', (err, rows) => {
      if (err) reject(err);
      else {
        const kpCounts: Record<string, number> = {};
        rows.forEach((row: any) => {
          if (row.knowledge_points) {
            try {
              const kps = JSON.parse(row.knowledge_points);
              kps.forEach((kp: string) => {
                kpCounts[kp] = (kpCounts[kp] || 0) + 1;
              });
            } catch {
              // ignore
            }
          }
        });
        const sorted = Object.entries(kpCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        resolve(sorted);
      }
    });
  });
}

/**
 * 搜索评价记录
 */
export async function searchRecords(params: {
  studentName?: string;
  knowledgePoint?: string;
  minScore?: number;
  maxScore?: number;
}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM evaluation_records WHERE 1=1';
    const conditions: string[] = [];
    const values: any[] = [];

    if (params.studentName && params.studentName.trim()) {
      conditions.push('student_name LIKE ?');
      values.push(`%${params.studentName.trim()}%`);
    }

    if (params.knowledgePoint && params.knowledgePoint.trim()) {
      conditions.push('knowledge_points LIKE ?');
      values.push(`%${params.knowledgePoint.trim()}%`);
    }

    if (params.minScore !== undefined && params.minScore !== null) {
      conditions.push('total_score >= ?');
      values.push(params.minScore);
    }

    if (params.maxScore !== undefined && params.maxScore !== null) {
      conditions.push('total_score <= ?');
      values.push(params.maxScore);
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    sqlite.all(sql, values, (err, rows) => {
      if (err) reject(err);
      else {
        const records = rows.map((row: any) => ({
          ...row,
          knowledgePoints: row.knowledge_points ? JSON.parse(row.knowledge_points) : [],
        }));
        resolve(records);
      }
    });
  });
}

/**
 * 获取所有学生姓名列表
 */
export async function getAllStudentNames() {
  return new Promise((resolve, reject) => {
    sqlite.all('SELECT DISTINCT student_name FROM evaluation_records ORDER BY student_name', (err, rows) => {
      if (err) reject(err);
      else {
        resolve(rows.map((row: any) => row.student_name));
      }
    });
  });
}