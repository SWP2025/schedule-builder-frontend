import { useState, useCallback, useEffect } from 'react';
import { Conflict } from '../../lib/types';
import { getIgnoredConflictIds, removeIgnoredConflict, generateConflictId } from '../../lib/utils';
import Card from './ConflictCard';
import innohassleSvg from '../innohassle.svg';

interface IgnoredConflictsPageProps {
  onBack: () => void;
  conflicts: Conflict[][];
}

export default function IgnoredConflictsPage({ onBack, conflicts }: IgnoredConflictsPageProps) {
  const [ignoredConflicts, setIgnoredConflicts] = useState<Conflict[][]>([]);

  // Получаем игнорируемые конфликты
  const getIgnoredConflicts = useCallback(() => {
    const ignoredIds = getIgnoredConflictIds();
    const ignored: Conflict[][] = [];

    conflicts.forEach(conflictGroup => {
      const ignoredGroup = conflictGroup.filter(conflict => {
        const conflictId = generateConflictId(conflict);
        return ignoredIds.includes(conflictId);
      });
      if (ignoredGroup.length > 0) {
        ignored.push(ignoredGroup);
      }
    });

    return ignored;
  }, [conflicts]);

  // Обработчик для восстановления конфликта
  const handleRestoreConflict = useCallback((conflict: Conflict) => {
    removeIgnoredConflict(conflict);
    // Обновляем состояние для перерендера
    setIgnoredConflicts(getIgnoredConflicts());
  }, [getIgnoredConflicts]);

  // Получаем игнорируемые конфликты при монтировании
  useEffect(() => {
    setIgnoredConflicts(getIgnoredConflicts());
  }, [getIgnoredConflicts]);

  const totalIgnored = ignoredConflicts.reduce((total, group) => total + group.length, 0);

  return (
    <div className="text-center text-white flex flex-col gap-3 h-full">
      <div className="flex items-center w-full justify-between">
        <button
          onClick={onBack}
          className=" absolute top-2 right-2 w-8 h-8 text-sm bg-gray-700 hover:bg-gray-700 text-white rounded-full transition-colors"
        >
          x
        </button>
      </div>

      <h2 className="text-xl font-semibold">Ignored Conflicts</h2>
      
      {totalIgnored > 0 ? (
        <>
          <p className="text-subtle">Total ignored conflicts: {totalIgnored}</p>
          
          <div className="flex flex-col gap-3">
            {ignoredConflicts.map((data, index) => (
              <div key={index} className="flex flex-col gap-10">
                {data.map((data2, index2) => (
                  <div key={index * data.length + index2} className="relative">
                    <Card 
                      lesson={data2} 
                      onIgnore={() => handleRestoreConflict(data2)}
                      mode="restore"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-subtle text-lg">No ignored conflicts</p>
          <p className="text-subtle text-sm mt-2">All ignored conflicts will appear here</p>
        </div>
      )}
    </div>
  );
} 