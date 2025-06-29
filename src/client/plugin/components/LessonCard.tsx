import { formatTimeForMoscow, groupNameToDisplayText, addIgnoredConflict, removeIgnoredConflict } from "../../lib/utils"

import { type Conflict } from "../../lib/types";
import { collisionTypeToDisplayText } from "../../lib/utils";
import { serverFunctions } from "../../lib/serverFunctions";

interface LessonCardProps {
  lesson: Conflict;
  onIgnore?: () => void;
  mode?: 'ignore' | 'restore';
}

export default function LessonCard({ lesson, onIgnore, mode = 'ignore' }: LessonCardProps) {
  const timeString = formatTimeForMoscow(lesson.start_time)

  const handleAction = () => {
    if (mode === 'ignore') {
      addIgnoredConflict(lesson);
    } else {
      removeIgnoredConflict(lesson);
    }
    
    if (onIgnore) {
      onIgnore();
    }
  };

  const isRestoreMode = mode === 'restore';
  const buttonClass = isRestoreMode 
    ? "text-[10px] w-4 h-4 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors absolute top-1 right-1 flex items-center justify-center"
    : "text-[10px] w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors absolute top-1 right-1 flex items-center justify-center";
  
  const buttonTitle = isRestoreMode ? "Restore this conflict" : "Ignore this conflict";
  const buttonText = isRestoreMode ? "↻" : "×";

  return (
    <div className="bg-dark border border-innohassle w-full text-center p-3 rounded-md select-text relative">
        <button
            onClick={handleAction}
            className={buttonClass}
            title={buttonTitle}
          >
            {buttonText}
          </button>
      <p className="text-highlight">{lesson.lesson_name}</p>
      {"group_name" in lesson && <p title={lesson.group_name.toString()} className="">{groupNameToDisplayText(lesson.group_name)}</p>}
      <p className="text-highlight">{lesson.teacher}</p>
      <p className="select-text">{timeString} - {lesson.room}</p>

      <hr className="my-1 border-subtle"/>

      <p className="text-sm font-bold">{collisionTypeToDisplayText(lesson.collision_type)}</p>
      {"excel_range" in lesson && <button className="border px-6 py-1 select-none" onClick={() => serverFunctions.selectTheRangeForUser(lesson.excel_range)}>Select the range</button>}
    </div>
  );
}
