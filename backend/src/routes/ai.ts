import { Router, Request, Response } from 'express';

const router = Router();

// AI Symptom Analysis endpoint
router.post('/symptom-analysis', async (req: Request, res: Response) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        error: { message: 'Symptoms array is required and cannot be empty' }
      });
    }

    // Mock AI analysis - in production, this would integrate with actual AI services
    const analysis = performSymptomAnalysis(symptoms);

    res.json({
      data: {
        analysis,
        disclaimer: 'This analysis is for informational purposes only and should not replace professional medical advice.'
      }
    });
  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({ error: { message: 'Failed to analyze symptoms' } });
  }
});

// Mock AI analysis function
function performSymptomAnalysis(symptoms: any[]) {
  const recommendations = [];

  // Emergency symptoms check
  const emergencySymptoms = [
    'coughing up blood', 'severe headache', 'seizures', 'loss of consciousness',
    'chest pain', 'difficulty breathing', 'severe abdominal pain'
  ];

  const hasEmergency = symptoms.some((symptom: any) =>
    emergencySymptoms.some((emergency: string) =>
      symptom.name.toLowerCase().includes(emergency.toLowerCase())
    )
  );

  if (hasEmergency) {
    recommendations.push({
      condition: 'Potential Medical Emergency',
      probability: 95,
      urgency: 'emergency',
      description: 'Your symptoms may indicate a serious medical condition requiring immediate attention.',
      recommendations: [
        'Call emergency services (911) immediately',
        'Do not drive yourself to the hospital',
        'Stay with someone until help arrives'
      ],
      specialists: ['Emergency Medicine', 'Critical Care']
    });
  }

  // Common condition analysis
  const feverSymptoms = symptoms.filter((s: any) => s.name.toLowerCase().includes('fever'));
  if (feverSymptoms.length > 0) {
    recommendations.push({
      condition: 'Viral Infection or Fever',
      probability: 75,
      urgency: 'medium',
      description: 'Fever can be caused by various infections including viral illnesses.',
      recommendations: [
        'Rest and stay hydrated',
        'Take acetaminophen (Tylenol) or ibuprofen for fever',
        'Monitor temperature regularly',
        'Seek medical attention if fever >103°F or persists >3 days'
      ],
      specialists: ['Internal Medicine', 'Infectious Disease']
    });
  }

  const coughSymptoms = symptoms.filter((s: any) => s.name.toLowerCase().includes('cough'));
  if (coughSymptoms.length > 0) {
    recommendations.push({
      condition: 'Respiratory Condition',
      probability: 70,
      urgency: 'medium',
      description: 'Cough can indicate various respiratory conditions.',
      recommendations: [
        'Stay hydrated and use a humidifier',
        'Try over-the-counter cough syrups',
        'Avoid irritants like smoke',
        'See a doctor if cough persists >2 weeks'
      ],
      specialists: ['Pulmonology', 'Internal Medicine']
    });
  }

  const headacheSymptoms = symptoms.filter((s: any) => s.name.toLowerCase().includes('headache'));
  if (headacheSymptoms.length > 0) {
    recommendations.push({
      condition: 'Headache or Migraine',
      probability: 65,
      urgency: 'low',
      description: 'Headaches can have various causes including stress, dehydration, or migraines.',
      recommendations: [
        'Rest in a dark, quiet room',
        'Apply cold or warm compresses',
        'Stay hydrated and maintain regular sleep',
        'Consider over-the-counter pain relievers',
        'Consult a doctor for frequent or severe headaches'
      ],
      specialists: ['Neurology', 'Internal Medicine']
    });
  }

  const nauseaSymptoms = symptoms.filter((s: any) => s.name.toLowerCase().includes('nausea'));
  if (nauseaSymptoms.length > 0) {
    recommendations.push({
      condition: 'Gastrointestinal Issue',
      probability: 60,
      urgency: 'medium',
      description: 'Nausea can be caused by various gastrointestinal or systemic conditions.',
      recommendations: [
        'Eat small, frequent meals',
        'Stay hydrated with clear fluids',
        'Avoid strong odors and fatty foods',
        'Consider anti-nausea medication if available',
        'Seek medical attention if vomiting blood or severe dehydration'
      ],
      specialists: ['Gastroenterology', 'Internal Medicine']
    });
  }

  // Default recommendation if no specific matches
  if (recommendations.length === 0) {
    recommendations.push({
      condition: 'General Health Concern',
      probability: 50,
      urgency: 'low',
      description: 'Your symptoms require professional medical evaluation.',
      recommendations: [
        'Schedule an appointment with your primary care physician',
        'Keep a symptom diary for accurate diagnosis',
        'Avoid self-diagnosis and self-medication'
      ],
      specialists: ['Internal Medicine', 'Family Medicine']
    });
  }

  return {
    symptomsAnalyzed: symptoms.length,
    recommendations: recommendations.sort((a: any, b: any) => b.probability - a.probability),
    analysisDate: new Date().toISOString(),
    confidence: 'moderate'
  };
}

export default router;