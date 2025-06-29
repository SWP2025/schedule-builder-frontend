import { useContext, useReducer, useState } from 'react';
import { getAllCollisions } from '../../lib/apis';
import { CollisionType, ConflictResponse } from '../../lib/types';
import {
  filterConflicts,
  getActiveFilterLabel,
  getFilterOptions,
} from '../../utils/filterUtils';
import innohassleSvg from '../innohassle.svg';
import Card from './ConflictCard';
import { getLengthOf2DArray } from '../../lib/utils';
import { serverFunctions } from '../../lib/serverFunctions';
import Spinner from './Spinner';
import APIForm from './apiToken/form';
import apiContext from '../contexts/apiTokenContext';

enum ActionType {
  REQUEST_STARTED = 1,
  REQUEST_SUCCESSFUL = 2,
  REQUEST_FAILED = 3,
}

type Action =
  | {
      type: ActionType.REQUEST_STARTED;
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
  error: string;
  isLoading: boolean;
  conflicts: ConflictResponse;
}

function reducerLogic(state: StateType, action: Action): StateType {
  switch (action.type) {
    case ActionType.REQUEST_STARTED:
      return { ...state, error: '', isLoading: true };
    case ActionType.REQUEST_FAILED:
      return { ...state, error: action.error, isLoading: false };
    case ActionType.REQUEST_SUCCESSFUL:
      return { error: '', isLoading: false, conflicts: action.conflicts };
  }
}

export default function Main() {
  const [state, dispatch] = useReducer(reducerLogic, {
    error: '',
    isLoading: false,
    conflicts: [],
  });
  const { conflicts, isLoading, error } = state;
  const [activeFilter, setActiveFilter] = useState<CollisionType | 'all'>(
    'all'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { token } = useContext(apiContext);

  const totalIssues = getLengthOf2DArray(conflicts);
  const filterOptions = getFilterOptions(conflicts);
  const filteredConflicts = filterConflicts(conflicts, activeFilter);
  const filteredTotalIssues = getLengthOf2DArray(filteredConflicts);
  const currentYear = new Date().getFullYear();

  async function getConflicts() {
    if (token === undefined || token === '') {
      dispatch({
        type: ActionType.REQUEST_FAILED,
        error: 'Please paste the token before checking the schedule',
      });
      return;
    }

    dispatch({ type: ActionType.REQUEST_STARTED });
    const spreadsheetID = await serverFunctions.getSpreadsheetID();
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
            Fetching info...
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
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-0.5 bg-gradient-to-b from-[#8C35F6] to-[#5C20A6] rounded-lg">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-4 bg-gradient-to-b from-[#323232] to-[#282828] rounded-[calc(0.5rem-1px)] text-left min-w-[200px] flex justify-between items-center hover:brightness-110 transition-all"
                >
                  <span>
                    {getActiveFilterLabel(activeFilter, filterOptions)}
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
                    {filterOptions.map((option) => (
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
                    ))}
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
        </>
      )}

      <div className="flex flex-col gap-3 -mr-8">
        {filteredConflicts.map((data, index) => (
          <>
            {data.map((data2, index2) => (
                <Card key={index * data.length + index2} lesson={data2} />
            ))}
            <hr className='py-2 border-highlight'/>
          </>
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
    </main>
  );
}
