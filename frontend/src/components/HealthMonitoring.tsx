import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Thermometer, Activity, Weight, Ruler,
  TrendingUp, TrendingDown, Minus, Plus, Calendar,
  BarChart3, Target, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface VitalSign {
  id: string;
  type: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight' | 'height' | 'bloodSugar';
  value: number;
  unit: string;
  date: string;
  notes?: string;
}

interface HealthGoal {
  id: string;
  type: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
}

const HealthMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVitalSign, setNewVitalSign] = useState({
    type: 'heartRate' as VitalSign['type'],
    value: '',
    unit: 'bpm',
    notes: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access health monitoring');
      navigate('/login');
      return;
    }
    loadHealthData();
  }, [isAuthenticated, navigate]);

  const loadHealthData = () => {
    // Load from localStorage for demo (in production, this would be from API)
    const savedVitals = localStorage.getItem(`health_vitals_${user?.id}`);
    const savedGoals = localStorage.getItem(`health_goals_${user?.id}`);

    if (savedVitals) {
      setVitalSigns(JSON.parse(savedVitals));
    } else {
      // Add some sample data
      const sampleVitals: VitalSign[] = [
        {
          id: '1',
          type: 'heartRate',
          value: 72,
          unit: 'bpm',
          date: new Date().toISOString(),
          notes: 'Resting heart rate'
        },
        {
          id: '2',
          type: 'bloodPressure',
          value: 120,
          unit: 'mmHg',
          date: new Date().toISOString(),
          notes: 'Systolic pressure'
        },
        {
          id: '3',
          type: 'temperature',
          value: 98.6,
          unit: '°F',
          date: new Date().toISOString(),
          notes: 'Normal body temperature'
        }
      ];
      setVitalSigns(sampleVitals);
      localStorage.setItem(`health_vitals_${user?.id}`, JSON.stringify(sampleVitals));
    }

    if (savedGoals) {
      setHealthGoals(JSON.parse(savedGoals));
    } else {
      // Add sample goals
      const sampleGoals: HealthGoal[] = [
        {
          id: '1',
          type: 'Weight Loss',
          target: 150,
          current: 165,
          unit: 'lbs',
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'Heart Rate',
          target: 70,
          current: 72,
          unit: 'bpm',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setHealthGoals(sampleGoals);
      localStorage.setItem(`health_goals_${user?.id}`, JSON.stringify(sampleGoals));
    }
  };

  const addVitalSign = () => {
    if (!newVitalSign.value || isNaN(Number(newVitalSign.value))) {
      toast.error('Please enter a valid value');
      return;
    }

    const vitalSign: VitalSign = {
      id: Date.now().toString(),
      type: newVitalSign.type,
      value: Number(newVitalSign.value),
      unit: newVitalSign.unit,
      date: new Date().toISOString(),
      notes: newVitalSign.notes
    };

    const updatedVitals = [vitalSign, ...vitalSigns];
    setVitalSigns(updatedVitals);
    localStorage.setItem(`health_vitals_${user?.id}`, JSON.stringify(updatedVitals));

    setNewVitalSign({
      type: 'heartRate',
      value: '',
      unit: 'bpm',
      notes: ''
    });
    setShowAddForm(false);
    toast.success('Vital sign added successfully');
  };

  const getVitalSignIcon = (type: string) => {
    switch (type) {
      case 'heartRate': return <Heart className="w-5 h-5 text-red-500" />;
      case 'bloodPressure': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'temperature': return <Thermometer className="w-5 h-5 text-orange-500" />;
      case 'weight': return <Weight className="w-5 h-5 text-green-500" />;
      case 'height': return <Ruler className="w-5 h-5 text-purple-500" />;
      case 'bloodSugar': return <BarChart3 className="w-5 h-5 text-pink-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getVitalSignLabel = (type: string) => {
    switch (type) {
      case 'heartRate': return 'Heart Rate';
      case 'bloodPressure': return 'Blood Pressure';
      case 'temperature': return 'Temperature';
      case 'weight': return 'Weight';
      case 'height': return 'Height';
      case 'bloodSugar': return 'Blood Sugar';
      default: return type;
    }
  };

  const getUnitForType = (type: VitalSign['type']) => {
    switch (type) {
      case 'heartRate': return 'bpm';
      case 'bloodPressure': return 'mmHg';
      case 'temperature': return '°F';
      case 'weight': return 'lbs';
      case 'height': return 'inches';
      case 'bloodSugar': return 'mg/dL';
      default: return '';
    }
  };

  const getLatestValue = (type: string) => {
    const latest = vitalSigns.filter(v => v.type === type).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return latest;
  };

  const getTrend = (type: string) => {
    const values = vitalSigns.filter(v => v.type === type).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ).slice(-5); // Last 5 readings

    if (values.length < 2) return null;

    const recent = values.slice(-2);
    const change = recent[1].value - recent[0].value;

    if (Math.abs(change) < 1) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const filteredVitals = selectedMetric === 'all'
    ? vitalSigns
    : vitalSigns.filter(v => v.type === selectedMetric);

  const getGoalProgress = (goal: HealthGoal) => {
    if (goal.type.toLowerCase().includes('loss') || goal.type.toLowerCase().includes('decrease')) {
      return Math.max(0, ((goal.current - goal.target) / (goal.current - goal.target + 1)) * 100);
    }
    return Math.min(100, (goal.current / goal.target) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Monitoring</h1>
          <p className="text-lg text-gray-600">
            Track your vital signs and health goals
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Current Vitals */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Current Vitals
              </h2>

              <div className="space-y-4">
                {['heartRate', 'bloodPressure', 'temperature', 'weight'].map(type => {
                  const latest = getLatestValue(type);
                  const trend = getTrend(type);

                  if (!latest) return null;

                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getVitalSignIcon(type)}
                        <div>
                          <p className="font-medium text-gray-900">{getVitalSignLabel(type)}</p>
                          <p className="text-sm text-gray-600">
                            {latest.value} {latest.unit}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                        {trend === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Health Goals */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Health Goals
              </h2>

              <div className="space-y-4">
                {healthGoals.map(goal => (
                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{goal.type}</h3>
                      <span className="text-sm text-gray-600">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getGoalProgress(goal)}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Vital Signs History</h2>
                  <p className="text-gray-600">Track your health metrics over time</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Metrics</option>
                    <option value="heartRate">Heart Rate</option>
                    <option value="bloodPressure">Blood Pressure</option>
                    <option value="temperature">Temperature</option>
                    <option value="weight">Weight</option>
                    <option value="bloodSugar">Blood Sugar</option>
                  </select>

                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Reading
                  </button>
                </div>
              </div>
            </div>

            {/* Vital Signs List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {filteredVitals.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No vital signs recorded</h3>
                    <p className="text-gray-600 mb-4">Start tracking your health by adding your first reading</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Reading
                    </button>
                  </div>
                ) : (
                  filteredVitals.map((vital, index) => (
                    <motion.div
                      key={vital.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        {getVitalSignIcon(vital.type)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getVitalSignLabel(vital.type)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {vital.value} {vital.unit}
                            {vital.notes && ` • ${vital.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(vital.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(vital.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add Vital Sign Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold mb-4">Add Vital Sign</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metric Type
                  </label>
                  <select
                    value={newVitalSign.type}
                    onChange={(e) => {
                      const type = e.target.value as VitalSign['type'];
                      setNewVitalSign(prev => ({
                        ...prev,
                        type,
                        unit: getUnitForType(type)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="heartRate">Heart Rate</option>
                    <option value="bloodPressure">Blood Pressure</option>
                    <option value="temperature">Temperature</option>
                    <option value="weight">Weight</option>
                    <option value="height">Height</option>
                    <option value="bloodSugar">Blood Sugar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value ({newVitalSign.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitalSign.value}
                    onChange={(e) => setNewVitalSign(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={newVitalSign.notes}
                    onChange={(e) => setNewVitalSign(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addVitalSign}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Reading
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthMonitoring;