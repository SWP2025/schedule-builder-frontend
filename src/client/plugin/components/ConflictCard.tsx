import LessonCard from "./LessonCard"
import { type Conflict } from "../../lib/types";

interface ConflictCardProps {
  lesson: Conflict;
  onIgnore?: () => void;
  mode?: 'ignore' | 'restore';
}

export default function Card(props: ConflictCardProps) {


  return (
    <div className="p-0.5 bg-gradient-to-b from-[#8C35F6] to-[#5C20A6] rounded-lg">
      <div className="p-1 bg-gradient-to-b from-[#323232] to-[#282828] rounded-[calc(0.5rem-1px)] select-none">
        <div className="text-start text-sm">
          <LessonCard 
            lesson={props.lesson} 
            onIgnore={props.onIgnore} 
            mode={props.mode}
          />
        </div>
      </div>
    </div>
  );
}
