import { CalorieCalculator } from "@/components/website/CalorieCalculator";
import { Calculator, Flame, Droplets } from "lucide-react";
import { useState } from "react";

export default function Tools() {
  const [bmiResult, setBmiResult] = useState<{bmi: number, category: string} | null>(null);
  const [hydrationResult, setHydrationResult] = useState<number | null>(null);
  const [bmiHeight, setBmiHeight] = useState<number | ''>('');
  const [bmiWeight, setBmiWeight] = useState<number | ''>('');
  const [hydrationWeight, setHydrationWeight] = useState<number | ''>('');
  const [hydrationActivity, setHydrationActivity] = useState<'low'|'moderate'|'high'>('moderate');

  const calculateBMI = (height: number, weight: number) => {
    if (height <= 0 || weight <= 0) return;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal weight';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    
    setBmiResult({ bmi: Math.round(bmi * 10) / 10, category });
  };

  const calculateHydration = (weight: number, activity: string) => {
    if (weight <= 0) return;
    
    let baseWater = weight * 30; // 30ml per kg
    
    const multipliers: {[key: string]: number} = {
      'low': 1.0,
      'moderate': 1.2,
      'high': 1.5
    };
    
    const totalWater = baseWater * (multipliers[activity] || 1.0);
    setHydrationResult(Math.round(totalWater));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="space-y-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white">Fitness Tools</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Calorie Calculator */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <Flame className="w-5 h-5" />
              <h2 className="font-bold text-white">Calorie Calculator</h2>
            </div>
            <CalorieCalculator />
          </div>

          {/* BMI Calculator */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Calculator className="w-5 h-5" />
              <h2 className="font-bold text-white">BMI Calculator</h2>
            </div>
            <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20">
              <p className="text-white/70 mb-4">Calculate your Body Mass Index (BMI) to check if you're in a healthy weight range.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Height (cm)" 
                    value={bmiHeight}
                    onChange={(e) => setBmiHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0" 
                  />
                  <input 
                    type="number" 
                    placeholder="Weight (kg)" 
                    value={bmiWeight}
                    onChange={(e) => setBmiWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0" 
                  />
                </div>
                <button 
                  className="w-full backdrop-blur-sm bg-blue-500/70 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors"
                  onClick={() => {
                    if (!bmiHeight || !bmiWeight) return setBmiResult(null);
                    calculateBMI(Number(bmiHeight), Number(bmiWeight));
                  }}
                >
                  Calculate BMI
                </button>
                {bmiResult && (
                  <div className="mt-4 p-4 backdrop-blur-sm bg-blue-500/20 rounded-lg border border-blue-500/30 text-center">
                    <p className="text-sm text-blue-300 font-medium mb-1">Your BMI</p>
                    <p className="text-3xl font-bold text-blue-200">{bmiResult.bmi}</p>
                    <p className="text-sm text-blue-300">{bmiResult.category}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Water Intake */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <Droplets className="w-5 h-5" />
              <h2 className="font-bold text-white">Hydration Calculator</h2>
            </div>
            <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20">
              <p className="text-white/70 mb-4">Estimate your daily water intake needs based on your activity level.</p>
                <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input 
                    type="number" 
                    placeholder="Weight (kg)" 
                    value={hydrationWeight}
                    onChange={(e) => setHydrationWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:border-white/40 focus:ring-0" 
                  />
                  <select 
                    value={hydrationActivity}
                    onChange={(e) => setHydrationActivity(e.target.value as any)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:border-white/40 focus:ring-0"
                  >
                    <option className="bg-slate-900" value="low">Low Activity</option>
                    <option className="bg-slate-900" value="moderate">Moderate Activity</option>
                    <option className="bg-slate-900" value="high">High Activity</option>
                  </select>
                  <button 
                    className="w-full backdrop-blur-sm bg-cyan-500/70 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold transition-colors"
                    onClick={() => {
                      if (!hydrationWeight) return setHydrationResult(null);
                      calculateHydration(Number(hydrationWeight), hydrationActivity);
                    }}
                  >
                    Calculate Water Intake
                  </button>
                </div>
                {hydrationResult && (
                  <div className="flex items-center justify-center">
                    <div className="p-6 backdrop-blur-sm bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-center">
                      <p className="text-sm text-cyan-300 font-medium mb-1">Daily Water Intake</p>
                      <p className="text-3xl font-bold text-cyan-200">{hydrationResult} <span className="text-lg font-normal">ml</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
