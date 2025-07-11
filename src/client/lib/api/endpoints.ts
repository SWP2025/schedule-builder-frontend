import { BASE_API_URL, API_TOKEN_INVALID_HTTP_STATUS } from '../constants';
import { ConflictResponse } from '../types';
import { APIResponse } from './types';

import { serverFunctions } from '../serverFunctions';

export default async function getAllCollisions(
  onStatusChange: (arg0: string) => void,
  token: string
): Promise<APIResponse<ConflictResponse>> {
  onStatusChange('Requesting spreadsheet ID...');
  const spreadsheetID = await serverFunctions.getSpreadsheetID();
  const url = `${BASE_API_URL}/collisions/check`;
  const params = new URLSearchParams({
    google_spreadsheet_id: spreadsheetID,
  });

  try {
    onStatusChange('Fetching collisions...');
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === API_TOKEN_INVALID_HTTP_STATUS) {
        return {
          success: false,
          error: 'The API token you provided is wrong',
        };
      }

      return {
        success: false,
        error: `Backend sent ${response.status} status code =(`,
      };
    }

    const data: ConflictResponse = await response.json();
    return { success: true, payload: data };
  } catch (error) {
    return { success: false, error: 'Something went wrong with the request' };
  }
}
