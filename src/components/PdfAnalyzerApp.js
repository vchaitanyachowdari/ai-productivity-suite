import React, { useState, useEffect, useCallback } from 'react';
import { transformNotes, models } from '../api';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// shadcn/ui components (placeholders for now, will add actual components)
const Button = ({ children, onClick, disabled, className }) => <button className={`px-4 py-2 rounded-md ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
const Input = ({ type, accept, onChange, className }) => <input type={type} accept={accept} onChange={onChange} className={`border p-2 rounded-md ${className}`} />;
const Textarea = ({ value, onChange, placeholder, className }) => <textarea value={value} onChange={onChange} placeholder={placeholder} className={`border p-2 rounded-md w-full ${className}`}></textarea>;
const Tabs = ({ children, defaultValue }) => <div className="flex flex-col">{children}</div>;
const TabsList = ({ children }) => <div className="flex border-b mb-4">{children}</div>;
const TabsTrigger = ({ value, children, onClick, isActive }) => <button className={`px-4 py-2 -mb-px border-b-2 ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`} onClick={onClick}>{children}</button>;
const TabsContent = ({ value, children, isActive }) => isActive ? <div className="p-4 border rounded-md">{children}</div> : null;

const PdfAnalyzerApp = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [entities, setEntities] = useState([]);
  const [wordFrequency, setWordFrequency] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);
  const [activeTab, setActiveTab] = useState('extractedText');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setModel(models[provider][0]);
  }, [provider]);

  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setExtractedText('');
      setSummary('');
      setEntities([]);
      setWordFrequency([]);
      setIsLoading(true);
      try {
        const text = await extractTextFromPdf(file);
        setExtractedText(text);
      } catch (err) {
        setError('Failed to extract text from PDF.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPdfFile(null);
      setError('Please upload a valid PDF file.');
    }
  };

  const analyzeText = async () => {
    if (!extractedText) {
      setError('No text extracted from PDF to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Summarization
      const generatedSummary = await transformNotes({
        provider,
        model,
        tool: 'pdf_analyzer',
        analysisType: 'summary',
        text: extractedText,
      });
      setSummary(generatedSummary);

      // Entity Extraction
      const generatedEntities = await transformNotes({
        provider,
        model,
        tool: 'pdf_analyzer',
        analysisType: 'entities',
        text: extractedText,
      });
      setEntities(JSON.parse(generatedEntities));

      // Word Frequency (client-side)
      const words = extractedText.toLowerCase().match(/\b\w+\b/g) || [];
      const frequencyMap = {};
      words.forEach(word => {
        frequencyMap[word] = (frequencyMap[word] || 0) + 1;
      });
      const sortedFrequency = Object.entries(frequencyMap)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 20); // Top 20 words
      setWordFrequency(sortedFrequency);

    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportContent = (type) => {
    let content = '';
    let filename = 'analysis_export';
    if (activeTab === 'summary') {
      content = summary;
      filename += '_summary';
    } else if (activeTab === 'entities') {
      content = JSON.stringify(entities, null, 2);
      filename += '_entities';
    } else if (activeTab === 'wordFrequency') {
      content = wordFrequency.map(([word, count]) => `${word}: ${count}`).join('\n');
      filename += '_word_frequency';
    } else {
      content = extractedText;
      filename += '_extracted_text';
    }

    if (type === 'markdown') {
      filename += '.md';
    } else {
      filename += '.txt';
    }

    const blob = new Blob([content], { type: `text/${type === 'markdown' ? 'markdown' : 'plain'}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`tool-container pdf-analyzer-app ${darkMode ? 'dark' : ''}`}>
      <div className="input-column">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">PDF Analyzer</h2>

        <div className="model-selector-container mb-4">
          <div className="field">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
              {Object.keys(models).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
              {models[provider].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="field mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload PDF File</label>
          <Input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-200 dark:hover:file:bg-gray-700" />
        </div>

        <Button onClick={analyzeText} disabled={isLoading || !extractedText} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
          {isLoading ? 'Analyzing...' : 'Analyze PDF'}
        </Button>
        {error && <div className="error-message mt-4 text-red-600 dark:text-red-400">{error}</div>}

        <div className="mt-6 flex justify-center">
          <Button onClick={() => setDarkMode(!darkMode)} className="bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300">
            Toggle {darkMode ? 'Light' : 'Dark'} Mode
          </Button>
        </div>
      </div>

      <div className="output-column p-6 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Analysis Results</h2>
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Analyzing PDF...</p>
          </div>
        )}

        {!isLoading && extractedText && (
          <Tabs defaultValue="extractedText" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="extractedText" isActive={activeTab === 'extractedText'} onClick={() => setActiveTab('extractedText')}>Extracted Text</TabsTrigger>
              <TabsTrigger value="summary" isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Summary</TabsTrigger>
              <TabsTrigger value="entities" isActive={activeTab === 'entities'} onClick={() => setActiveTab('entities')}>Entities</TabsTrigger>
              <TabsTrigger value="wordFrequency" isActive={activeTab === 'wordFrequency'} onClick={() => setActiveTab('wordFrequency')}>Word Frequency</TabsTrigger>
            </TabsList>
            <TabsContent value="extractedText" isActive={activeTab === 'extractedText'}>
              <Textarea value={extractedText} readOnly className="h-96 bg-gray-100 dark:bg-gray-700 dark:text-gray-100" />
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => exportContent('text')} className="bg-gray-600 hover:bg-gray-700 text-white">Export as Text</Button>
              </div>
            </TabsContent>
            <TabsContent value="summary" isActive={activeTab === 'summary'}>
              <Textarea value={summary} readOnly className="h-96 bg-gray-100 dark:bg-gray-700 dark:text-gray-100" />
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => exportContent('markdown')} className="bg-gray-600 hover:bg-gray-700 text-white">Export as Markdown</Button>
                <Button onClick={() => exportContent('text')} className="bg-gray-600 hover:bg-gray-700 text-white">Export as Text</Button>
              </div>
            </TabsContent>
            <TabsContent value="entities" isActive={activeTab === 'entities'}>
              <Textarea value={JSON.stringify(entities, null, 2)} readOnly className="h-96 bg-gray-100 dark:bg-gray-700 dark:text-gray-100" />
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => exportContent('text')} className="bg-gray-600 hover:bg-gray-700 text-white">Export as Text</Button>
              </div>
            </TabsContent>
            <TabsContent value="wordFrequency" isActive={activeTab === 'wordFrequency'}>
              <Textarea value={wordFrequency.map(([word, count]) => `${word}: ${count}`).join('\n')} readOnly className="h-96 bg-gray-100 dark:bg-gray-700 dark:text-gray-100" />
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => exportContent('text')} className="bg-gray-600 hover:bg-gray-700 text-white">Export as Text</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
        {!isLoading && !extractedText && !error && (
          <p className="text-center text-gray-500 dark:text-gray-400">Upload a PDF to start analyzing.</p>
        )}
      </div>
    </div>
  );
};

export default PdfAnalyzerApp;
