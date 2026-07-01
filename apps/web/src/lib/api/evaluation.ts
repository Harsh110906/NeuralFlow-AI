const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface EvaluationDataset {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
  versions?: EvaluationDatasetVersion[];
}

export interface EvaluationDatasetVersion {
  id: string;
  datasetId: string;
  version: number;
  description?: string;
  createdAt: string;
  testCases?: EvaluationTestCase[];
}

export interface EvaluationTestCase {
  id: string;
  input: any;
  expectedOut?: any;
  assertions: any;
}

export interface EvaluationRun {
  id: string;
  datasetVersionId: string;
  agentVersionId: string;
  status: string;
  deterministicPassRate?: number;
  judgeScoreAvg?: number;
  avgLatencyMs?: number;
  totalCostUsd?: number;
  judgeConfig?: any;
  judgeConfidenceAvg?: number;
  createdAt: string;
  datasetVersion?: any;
  agentVersion?: any;
}

export interface EvaluationTrace {
  id: string;
  evaluationRunId: string;
  input: any;
  output: any;
  rubric: string | null;
  judgeResponse: any;
  deterministicPassed: boolean | null;
  createdAt: string;
}

async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function getDatasets(workspaceId: string, token: string): Promise<EvaluationDataset[]> {
  return fetchWithAuth(`${API_URL}/evaluation-datasets?workspaceId=${workspaceId}`, token);
}

export async function getDataset(id: string, token: string): Promise<EvaluationDataset> {
  return fetchWithAuth(`${API_URL}/evaluation-datasets/${id}`, token);
}

export async function getDatasetVersions(datasetId: string, token: string): Promise<EvaluationDatasetVersion[]> {
  return fetchWithAuth(`${API_URL}/evaluation-datasets/${datasetId}/versions`, token);
}

export async function getTestCases(versionId: string, token: string): Promise<EvaluationTestCase[]> {
  return fetchWithAuth(`${API_URL}/evaluation-datasets/versions/${versionId}/testcases`, token);
}

export async function createDataset(workspaceId: string, name: string, description: string | undefined, token: string) {
  return fetchWithAuth(`${API_URL}/evaluation-datasets`, token, {
    method: 'POST',
    body: JSON.stringify({ workspaceId, name, description }),
  });
}

export async function createDatasetVersion(datasetId: string, description: string, testCases: any[], token: string) {
  return fetchWithAuth(`${API_URL}/evaluation-datasets/${datasetId}/versions`, token, {
    method: 'POST',
    body: JSON.stringify({ description, testCases }),
  });
}

export async function getEvaluationRuns(workspaceId: string, token: string): Promise<EvaluationRun[]> {
  return fetchWithAuth(`${API_URL}/evaluation-runs?workspaceId=${workspaceId}`, token);
}

export async function getEvaluationRun(id: string, token: string): Promise<EvaluationRun> {
  return fetchWithAuth(`${API_URL}/evaluation-runs/${id}`, token);
}

export async function getEvaluationTraces(runId: string, token: string): Promise<EvaluationTrace[]> {
  return fetchWithAuth(`${API_URL}/evaluation-runs/${runId}/traces`, token);
}

export async function triggerEvaluationRun(workspaceId: string, datasetVersionId: string, agentVersionId: string, judgeModel: string, token: string) {
  return fetchWithAuth(`${API_URL}/evaluation-runs`, token, {
    method: 'POST',
    body: JSON.stringify({ workspaceId, datasetVersionId, agentVersionId, judgeModel }),
  });
}

export async function runPlayground(workspaceId: string, agentVersionId: string, input: any, token: string) {
  return fetchWithAuth(`${API_URL}/evaluation-runs/playground`, token, {
    method: 'POST',
    body: JSON.stringify({ workspaceId, agentVersionId, input }),
  });
}
