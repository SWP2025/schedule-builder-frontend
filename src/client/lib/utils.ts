import { CollisionType, Conflict } from "./types";

export function formatTimeForMoscow(timeString: string): string {
  // Accepts time strings like: "17:33:22.719Z" and converts them to more concise time in Moscow timezone: "20:33"

  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const fullTimestamp = `${today}T${timeString}`; // "YYYY-MM-DDTHH:MM:SS.MMMZ"
  const date = new Date(fullTimestamp);

  if (isNaN(date.getTime())) {
    console.error('Invalid time string:', timeString);
    return 'Invalid Time';
  }

  const moscowOffset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const moscowTime = new Date(date.getTime() + moscowOffset);

  const hours = moscowTime.getUTCHours().toString().padStart(2, '0');
  const minutes = moscowTime.getUTCMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function collisionTypeToDisplayText(type: CollisionType): string {
  switch (type) {
    case CollisionType.CAPACITY:
      return "Capacity exceeded"
    case CollisionType.ROOM:
      return "The room is taken"
    case CollisionType.TEACHER:
      return "The teacher is busy"
    case CollisionType.OUTLOOK:
      return "Collision with something in outlook"
  }
}

export function groupNameToDisplayText(name: string | string[]): string {
  if (Array.isArray(name)) {
    if (name.length === 0) {
      return "EMPTY ARRAY!"
    }

    return `${name[0]}...`
  }

  return name;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getLengthOf2DArray(array: any[][]): number {
  return array.reduce((total, row) => total + row.length, 0)
}

// Функции для работы с игнорируемыми конфликтами
const IGNORED_CONFLICTS_KEY = 'ignored_conflicts';

export function generateConflictId(conflict: Conflict): string {
  // Создаем уникальный ID на основе свойств конфликта
  const base = `${conflict.lesson_name}_${conflict.weekday}_${conflict.start_time}_${conflict.end_time}_${conflict.room}_${conflict.teacher}_${conflict.collision_type}`;
  
  // Добавляем дополнительные свойства в зависимости от типа конфликта
  if ('excel_range' in conflict) {
    return `${base}_${conflict.excel_range}`;
  }
  
  return base;
}

export function getIgnoredConflictIds(): string[] {
  try {
    const ignored = localStorage.getItem(IGNORED_CONFLICTS_KEY);
    return ignored ? JSON.parse(ignored) : [];
  } catch (error) {
    console.error('Error reading ignored conflicts from localStorage:', error);
    return [];
  }
}

export function addIgnoredConflict(conflict: Conflict): void {
  try {
    const ignoredIds = getIgnoredConflictIds();
    const conflictId = generateConflictId(conflict);
    
    if (!ignoredIds.includes(conflictId)) {
      ignoredIds.push(conflictId);
      localStorage.setItem(IGNORED_CONFLICTS_KEY, JSON.stringify(ignoredIds));
    }
  } catch (error) {
    console.error('Error adding ignored conflict to localStorage:', error);
  }
}

export function removeIgnoredConflict(conflict: Conflict): void {
  try {
    const ignoredIds = getIgnoredConflictIds();
    const conflictId = generateConflictId(conflict);
    const filteredIds = ignoredIds.filter(id => id !== conflictId);
    
    localStorage.setItem(IGNORED_CONFLICTS_KEY, JSON.stringify(filteredIds));
  } catch (error) {
    console.error('Error removing ignored conflict from localStorage:', error);
  }
}

export function isConflictIgnored(conflict: Conflict): boolean {
  const ignoredIds = getIgnoredConflictIds();
  const conflictId = generateConflictId(conflict);
  return ignoredIds.includes(conflictId);
}

export function filterIgnoredConflicts(conflicts: Conflict[][]): Conflict[][] {
  return conflicts.map(conflictGroup => 
    conflictGroup.filter(conflict => !isConflictIgnored(conflict))
  ).filter(group => group.length > 0);
}

export function clearAllIgnoredConflicts(): void {
  try {
    localStorage.removeItem(IGNORED_CONFLICTS_KEY);
  } catch (error) {
    console.error('Error clearing ignored conflicts from localStorage:', error);
  }
}

export function millisecondsToDays(milliseconds: number): number {
  return milliseconds / 1000 / 60 / 60 / 24
}