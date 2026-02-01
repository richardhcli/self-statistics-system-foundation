import { AppData } from '../types';

/**
 * Utility: exportAppState
 * 
 * Functional Description:
 * Serializes the current AppData state to JSON and triggers a browser-level
 * file download.
 */
export const exportAppState = (data: AppData) => {
  try {
    const fileName = `neural-brain-backup-${new Date().toISOString().split('T')[0]}.json`;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  } catch (err) {
    console.error("Export failed:", err);
    throw new Error("Failed to generate and download backup file.");
  }
};

/**
 * Utility: parseAndValidateBackup
 * 
 * Functional Description:
 * Parses a JSON string and validates it against the expected AppData schema.
 * Ensures critical keys are present before allowing a state overwrite.
 */
export const parseAndValidateBackup = (jsonContent: string): AppData => {
  try {
    const importedData = JSON.parse(jsonContent) as AppData;

    // Basic structural validation
    const requiredKeys: (keyof AppData)[] = [
      'journal', 
      'cdagTopology', 
      'playerStatistics', 
      'userInformation'
    ];
    
    const missingKeys = requiredKeys.filter(k => !(k in importedData));

    if (missingKeys.length > 0) {
      throw new Error(`Invalid backup file format. Missing mandatory structures: ${missingKeys.join(', ')}`);
    }

    return importedData;
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      throw new Error("Failed to parse file. Ensure it is a valid JSON document.");
    }
    throw err;
  }
};
