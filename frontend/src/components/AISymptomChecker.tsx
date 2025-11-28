import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, CheckCircle, Search, Plus, X, Stethoscope, Activity, Thermometer } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

interface AIRecommendation {
  condition: string;
  probability: number;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  recommendations: string[];
  specialists: string[];
}

const AISymptomChecker: React.FC = () => {
  const { user } = useAuthStore();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [currentSeverity, setCurrentSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [currentDuration, setCurrentDuration] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [showResults, setShowResults] = useState(false);

  const commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Sore throat', 'Fatigue', 'Nausea', 'Dizziness',
    'Chest pain', 'Shortness of breath', 'Abdominal pain', 'Joint pain', 'Rash',
    'Coughing up blood', 'Severe headache', 'Confusion', 'Seizures', 'Loss of consciousness'
  ];

  const addSymptom = () => {
    if (!currentSymptom.trim()) {
      toast.error('Please enter a symptom');
      return;
    }

    const newSymptom: Symptom = {
      id: Date.now().toString(),
      name: currentSymptom.trim(),
      severity: currentSeverity,
      duration: currentDuration || 'Unknown'
    };

    setSymptoms([...symptoms, newSymptom]);
    setCurrentSymptom('');
    setCurrentDuration('');
    setCurrentSeverity('moderate');
  };

  const removeSymptom = (id: string) => {
    setSymptoms(symptoms.filter(s => s.id !== id));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setAnalyzing(true);
    setShowResults(false);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/ai/symptom-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ symptoms })
      });

      if (response.ok) {
        const data = await response.json();
        const analysis = data.data.analysis;
        setRecommendations(analysis.recommendations || []);
        setShowResults(true);
        toast.success('Analysis complete');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to analyze symptoms');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };


  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <Activity className="w-5 h-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Symptom Checker</h1>
          <p className="text-lg text-gray-600">
            Describe your symptoms and get AI-powered health insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Symptom Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Describe Your Symptoms
            </h2>

            {/* Add Symptom Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptom
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentSymptom}
                    onChange={(e) => setCurrentSymptom(e.target.value)}
                    placeholder="e.g., headache, fever, cough"
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                  />
                  <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={currentSeverity}
                    onChange={(e) => setCurrentSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={currentDuration}
                    onChange={(e) => setCurrentDuration(e.target.value)}
                    placeholder="e.g., 2 days, 1 week"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={addSymptom}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Symptom
              </button>
            </div>

            {/* Common Symptoms */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Common Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.slice(0, 12).map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => setCurrentSymptom(symptom)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Symptoms List */}
            {symptoms.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Symptoms</h3>
                <div className="space-y-2">
                  {symptoms.map((symptom) => (
                    <div key={symptom.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{symptom.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            symptom.severity === 'severe' ? 'bg-red-100 text-red-800' :
                            symptom.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {symptom.severity}
                          </span>
                          <span className="text-xs text-gray-500">• {symptom.duration}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSymptom(symptom.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={analyzeSymptoms}
              disabled={analyzing || symptoms.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing Symptoms...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze Symptoms
                </>
              )}
            </button>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              AI Analysis Results
            </h2>

            {!showResults ? (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
                <p className="text-gray-600">
                  Add your symptoms and click "Analyze Symptoms" to get AI-powered health insights
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {rec.condition}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">
                            Probability: {rec.probability}%
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(rec.urgency)}`}>
                            {getUrgencyIcon(rec.urgency)}
                            <span className="ml-1 capitalize">{rec.urgency}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{rec.description}</p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {rec.recommendations.map((recItem, idx) => (
                            <li key={idx}>{recItem}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recommended Specialists:</h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.specialists.map((specialist, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {specialist}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Important Disclaimer</h4>
                      <p className="text-sm text-yellow-800">
                        This AI analysis is for informational purposes only and should not replace professional medical advice.
                        Always consult with a qualified healthcare provider for proper diagnosis and treatment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AISymptomChecker;