import { useContext, useReducer, useState, useCallback } from 'react';
import { getAllCollisions } from '../../lib/apis';
import { CollisionType, ConflictResponse } from '../../lib/types';
import {
  filterConflicts,
  getActiveFilterLabel,
  getFilterOptions,
} from '../../utils/filterUtils';
import innohassleSvg from '../innohassle.svg';
import Card from './ConflictCard';
import { getLengthOf2DArray, filterIgnoredConflicts, clearAllIgnoredConflicts, getIgnoredConflictIds } from '../../lib/utils';
import { serverFunctions } from '../../lib/serverFunctions';
import Spinner from './Spinner';
import APIForm from './apiToken/form';
import apiContext from '../contexts/apiTokenContext';
import IgnoredConflictsPage from './IgnoredConflictsPage';

enum ActionType {
  REQUEST_IN_PROGRESS = 1,
  REQUEST_SUCCESSFUL = 2,
  REQUEST_FAILED = 3,
}

type Action =
  | {
      type: ActionType.REQUEST_IN_PROGRESS;
      step: string;
    }
  | {
      type: ActionType.REQUEST_FAILED;
      error: string;
    }
  | {
      type: ActionType.REQUEST_SUCCESSFUL;
      conflicts: ConflictResponse;
    };

interface StateType {
  step: string;
  error: string;
  isLoading: boolean;
  conflicts: ConflictResponse;
}

function reducerLogic(state: StateType, action: Action): StateType {
  switch (action.type) {
    case ActionType.REQUEST_IN_PROGRESS:
      return { ...state, step: action.step, error: '', isLoading: true };
    case ActionType.REQUEST_FAILED:
      return { ...state, step: '', error: action.error, isLoading: false };
    case ActionType.REQUEST_SUCCESSFUL:
      return { error: '', step: '', isLoading: false, conflicts: action.conflicts };
  }
}

export default function Main() {
  const [state, dispatch] = useReducer(reducerLogic, {
    step: '',
    error: '',
    isLoading: false,
    conflicts: [],
  });
  const { conflicts, isLoading, error } = state;
  const [activeFilter, setActiveFilter] = useState<CollisionType | 'all'>(
    'all'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ignoredConflicts, setIgnoredConflicts] = useState<ConflictResponse>([]);
  const [currentPage, setCurrentPage] = useState<'main' | 'ignored'>('main');
  const { token } = useContext(apiContext);

  // Фильтруем игнорируемые конфликты
  const visibleConflicts = filterIgnoredConflicts(conflicts);
  
  const totalIssues = getLengthOf2DArray(visibleConflicts);
  const filterOptions = getFilterOptions(visibleConflicts);
  const filteredConflicts = filterConflicts(visibleConflicts, activeFilter);
  const filteredTotalIssues = getLengthOf2DArray(filteredConflicts);
  const currentYear = new Date().getFullYear();

  // Проверяем, есть ли игнорируемые конфликты
  const hasIgnoredConflicts = getIgnoredConflictIds().length > 0;

  // Обработчик для игнорирования конфликта
  const handleIgnoreConflict = useCallback(() => {
    // Обновляем состояние, чтобы перерендерить компонент
    setIgnoredConflicts([...ignoredConflicts]);
  }, [ignoredConflicts]);

 

  // Обработчик для переключения на страницу игнорируемых конфликтов
  const handleShowIgnored = useCallback(() => {
    setCurrentPage('ignored');
  }, []);

  // Обработчик для возврата на главную страницу
  const handleBackToMain = useCallback(() => {
    setCurrentPage('main');
  }, []);

  async function getConflicts() {
    if (token === undefined || token === '') {
      dispatch({
        type: ActionType.REQUEST_FAILED,
        error: 'Please paste the token before checking the schedule',
      });
      return;
    }

    dispatch({ type: ActionType.REQUEST_IN_PROGRESS, step: "Requesting spreadsheet ID..." });
    const spreadsheetID = await serverFunctions.getSpreadsheetID();
    dispatch({ type: ActionType.REQUEST_IN_PROGRESS, step: "Fetching collisions..." });
    const response = await getAllCollisions(spreadsheetID, token);

    if (response.success) {
      dispatch({
        type: ActionType.REQUEST_SUCCESSFUL,
        conflicts: response.payload,
      });
    } else {
      dispatch({ type: ActionType.REQUEST_FAILED, error: response.error });
    }
  }

  return (
    <main className="text-center text-white flex flex-col gap-3 h-full">
      {currentPage === 'ignored' ? (
        <IgnoredConflictsPage 
          onBack={handleBackToMain} 
          conflicts={conflicts} 
        />
      ) : (
        <>
          <h1>
            InNo<span className="text-innohassle">Hassle</span> SCR
          </h1>
          <div>
            To test the compatibility of the schedule:
            <ol className="list-decimal text-start">
              <li>
                Go to this{' '}
                <a
                  target="_blank"
                  href="https://api.innohassle.ru/accounts/v0/tokens/generate-my-token"
                  className="text-innohassle"
                >
                  website
                </a>{' '}
                and copy the token
              </li>
              <li>Paste the token in the field below</li>
              <li>Press the button "Check the schedule"</li>
            </ol>
          </div>

          <APIForm />

          <button
            className="bg-innohassle disabled:bg-innohassle/50 text-base py-1 px-6 text-center rounded-full hover:brightness-75 disabled:hover:brightness-100 flex items-center justify-center gap-2"
            onClick={getConflicts}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner color="white" />
                <div aria-live="polite">{state.step}</div>
              </>
            ) : (
              'Check the scheduling'
            )}
          </button>

          {error && <p className="text-red-500">Error: {error}</p>}

          {totalIssues > 0 && (
            <>
              <h3 className="font-semibold">Number of issues: {totalIssues}</h3>

              {/* Custom Filter Selector */}
              <div className="flex justify-center gap-4 items-center">
                <div className="relative">
                  <div className="p-0.5 bg-gradient-to-b from-[#8C35F6] to-[#5C20A6] rounded-lg">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-4 bg-gradient-to-b from-[#323232] to-[#282828] rounded-[calc(0.5rem-1px)] text-left min-w-[200px] flex justify-between items-center hover:brightness-110 transition-all"
                    >
                      <span>
                        {getActiveFilterLabel(activeFilter, filterOptions)} ({' '}
                        {filteredTotalIssues} )
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-0.5 bg-gradient-to-b from-[#8C35F6] to-[#5C20A6] rounded-lg z-10">
                      <div className="bg-gradient-to-b from-[#323232] to-[#282828] rounded-[calc(0.5rem-1px)] overflow-hidden">
                        {filterOptions.map(
                          (option) =>
                            Number(option.count) > 0 && (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setActiveFilter(
                                    option.value as CollisionType | 'all'
                                  );
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors ${
                                  activeFilter === option.value
                                    ? 'bg-innohassle text-white'
                                    : 'text-white'
                                }`}
                              >
                                {option.label} ({option.count})
                              </button>
                            )
                        )}
                      </div>
                    </div>
                  )}
                </div>             
              </div>

              {activeFilter !== 'all' && (
                <p className="text-sm text-subtle">
                  Showing {filteredTotalIssues} of {totalIssues} issues
                </p>
              )}
          
                {hasIgnoredConflicts && (
                  <button 
                    className="text-sm text-subtle hover:text-white transition-colors" 
                    onClick={handleShowIgnored} 
                    title="Show ignored conflicts"
                  >
                    Show Ignored Conflicts
                  </button>
                )}
              
            </>
          )}

          <div className="flex flex-col gap-3">
            {filteredConflicts.map((data, index) => (
              <div key={index} className="flex flex-col gap-10">
                {data.map((data2, index2) => (
                  <Card 
                    key={index * data.length + index2} 
                    lesson={data2} 
                    onIgnore={handleIgnoreConflict}
                  />
                ))}
              </div>
            ))}
          </div>

          {totalIssues > 0 && filteredTotalIssues === 0 && (
            <p className="text-subtle text-center py-4">
              No issues match the selected filter.
            </p>
          )}

          <footer className="flex flex-col items-center mt-auto select-none">
            <a href="https://innohassle.ru" target="_blank">
              <img
                src={innohassleSvg}
                width={48}
                height={48}
                alt="innohassle-logo"
              />
            </a>
            <p className="mt-2">Schedule conflict resolver</p>
            <p>
              Project created for{' '}
              <span className="text-innohassle">Software Project 2025</span> course
            </p>
            <p className="mt-2 text-subtle">Copyright © {currentYear}</p>
          </footer>
        </>
      )}
    </main>
  );
}
