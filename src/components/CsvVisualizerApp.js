import React, { useState, useEffect } from 'react';
import { transformNotes, models } from '../api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

// Simple CSV parser (for demonstration purposes)
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split(',').map(item => item.trim()));
  return { headers, rows };
};

// Component to render different analysis types
const AnalysisOutput = ({ result }) => {
  if (!result) return null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: result.config?.title || 'Chart' },
    },
  };

  const chartData = {
    labels: result.data?.labels,
    datasets: [
      {
        label: result.config?.label || 'Value',
        data: result.data?.values,
        backgroundColor: result.config?.backgroundColor || 'rgba(75, 192, 192, 0.6)',
        borderColor: result.config?.borderColor || 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        ...result.config?.datasetOptions, // Allow AI to pass additional dataset options
      },
    ],
  };

  switch (result.type) {
    case 'bar_chart':
      return (
        <div className="chart-output">
          <Bar options={chartOptions} data={chartData} />
        </div>
      );
    case 'line_chart':
      return (
        <div className="chart-output">
          <Line options={chartOptions} data={chartData} />
        </div>
      );
    case 'table':
      return (
        <div className="table-output">
          <h3>{result.config?.title || 'Table'}</h3>
          <table>
            <thead>
              <tr>{result.data.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {result.data.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'count':
      return (
        <div className="count-output">
          <h3>{result.data.label || 'Count'}</h3>
          <p className="count-value">{result.data.value}</p>
        </div>
      );
    default:
      return <p>Unknown analysis type: {result.type}</p>;
  }
};

const CsvVisualizerApp = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState(null); // { headers: [], rows: [] }
  const [firstFiveRows, setFirstFiveRows] = useState('');
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);

  useEffect(() => {
    setModel(models[provider][0]);
  }, [provider]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const parsed = parseCSV(text);
          setCsvData(parsed);
          setFirstFiveRows(text.split('\n').slice(0, 5).join('\n'));
        } catch (parseError) {
          setError('Error parsing CSV file. Please ensure it\'s a valid CSV.');
          setCsvData(null);
          setFirstFiveRows('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateAnalysis = async () => {
    setError(null);
    setAnalysisResult(null);
    if (!csvData) {
      setError('Please upload a CSV file first.');
      return;
    }
    if (!analysisDescription.trim()) {
      setError('Please describe the analysis you want to run.');
      return;
    }

    setIsApiLoading(true);
    try {
      const generatedJsCode = await transformNotes({
        provider,
        model,
        tool: 'csv_visualizer',
        firstFiveRows,
        analysisDescription,
      });
      setIsApiLoading(false);
      setIsCalcLoading(true);

      // --- Dynamic Code Execution (with caution) ---
      // In a real-world scenario, executing AI-generated code directly can be a security risk.
      // For this mini-app, we proceed with `new Function()` for demonstration.
      // For production, consider sandboxing (e.g., web workers, iframes) or server-side execution.
      let analysisResult = null; // This variable will be set by the executed code
      const executeAnalysis = new Function('data', 'analysisDescription', 'analysisResult', generatedJsCode);
      executeAnalysis(csvData, analysisDescription, analysisResult);
      
      // Check if analysisResult was set by the executed code
      if (typeof window.analysisResult !== 'object' || !window.analysisResult.type) {
        throw new Error('Generated JavaScript did not produce a valid analysisResult object.');
      }
      setAnalysisResult(window.analysisResult);
      window.analysisResult = null; // Clear global variable

    } catch (apiOrExecError) {
      console.error('Analysis process failed:', apiOrExecError);
      setError(`Analysis failed: ${apiOrExecError.message}`);
    }
    setIsApiLoading(false);
    setIsCalcLoading(false);
  };

  return (
    <div className="tool-container csv-visualizer-app">
      <div className="input-column">
        <h2>CSV Data Visualizer</h2>

        <div className="model-selector-container">
          <div className="field">
            <label>Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              {Object.keys(models).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {models[provider].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Upload CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>

        {csvData && (
          <div className="csv-preview">
            <h3>First 5 Rows Preview:</h3>
            <table>
              <thead>
                <tr>{csvData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {csvData.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="field">
          <label>Describe Analysis</label>
          <textarea
            value={analysisDescription}
            onChange={(e) => setAnalysisDescription(e.target.value)}
            placeholder="e.g., Show the total sales per region as a bar chart. Calculate the average price of products. Display all data as a table."
          ></textarea>
        </div>

        <div className="action-buttons">
          <button onClick={handleGenerateAnalysis} disabled={isApiLoading || isCalcLoading || !csvData || !analysisDescription.trim()}>
            {isApiLoading ? 'Planning analysis...' : isCalcLoading ? 'Calculating results...' : 'Generate Analysis'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="output-column csv-output">
        <h2>Analysis Results</h2>
        {(isApiLoading || isCalcLoading) && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>{isApiLoading ? 'Planning analysis...' : 'Calculating results...'}</p>
          </div>
        )}
        {!isApiLoading && !isCalcLoading && analysisResult && (
          <AnalysisOutput result={analysisResult} />
        )}
        {!isApiLoading && !isCalcLoading && !analysisResult && !error && (
            <p className="placeholder-text">Upload a CSV and describe your analysis to see results.</p>
        )}
      </div>
    </div>
  );
};

export default CsvVisualizerApp;

