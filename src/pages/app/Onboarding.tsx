import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Step 1: Goal
const goalSchema = z.object({
  goal: z.enum(["lose_weight", "maintain_weight", "gain_weight", "build_muscle"]),
});

// Step 2: Personal Details
const personalSchema = z.object({
  gender: z.enum(["male", "female"]),
  dob: z.string().min(1, "Date of birth is required"),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
});

// Step 3: Activity & History
const activitySchema = z.object({
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  medicalHistory: z.string().optional(),
});

// Step 4: Targets
const targetSchema = z.object({
  targetWeight: z.number().min(30).max(300),
  weeklyGoal: z.enum(["0.25", "0.5", "0.75", "1"]),
  dailySteps: z.enum(["5000", "10000", "15000"]),
});

type OnboardingData = z.infer<typeof goalSchema> & 
                      z.infer<typeof personalSchema> & 
                      z.infer<typeof activitySchema> & 
                      z.infer<typeof targetSchema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const totalSteps = 4;

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data });
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      console.log("Finished:", { ...formData, ...data });
      navigate("/app/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="mb-8">
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Step {step} of {totalSteps}</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              {step === 1 && "What is your main goal?"}
              {step === 2 && "Tell us about yourself"}
              {step === 3 && "Activity & Health"}
              {step === 4 && "Set your targets"}
            </h2>
          </div>

          {step === 1 && <GoalStep onNext={handleNext} defaultValues={formData} />}
          {step === 2 && <PersonalStep onNext={handleNext} onBack={handleBack} defaultValues={formData} />}
          {step === 3 && <ActivityStep onNext={handleNext} onBack={handleBack} defaultValues={formData} />}
          {step === 4 && <TargetStep onNext={handleNext} onBack={handleBack} defaultValues={formData} />}
        </div>
      </div>
    </div>
  );
}

function GoalStep({ onNext, defaultValues }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="space-y-3">
        {[
          { id: "lose_weight", label: "Lose Weight" },
          { id: "maintain_weight", label: "Maintain Weight" },
          { id: "gain_weight", label: "Gain Weight" },
          { id: "build_muscle", label: "Build Muscle" },
        ].map((option) => (
          <label key={option.id} className="flex items-center p-4 border rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
            <input type="radio" value={option.id} {...register("goal")} className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500" />
            <span className="ml-3 font-medium text-slate-700 group-hover:text-emerald-700">{option.label}</span>
          </label>
        ))}
      </div>
      {errors.goal && <p className="text-red-500 text-sm">{errors.goal.message as string}</p>}
      <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-6">
        Next Step <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

function PersonalStep({ onNext, onBack, defaultValues }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50">
            <input type="radio" value="male" {...register("gender")} className="sr-only" />
            <span>Male</span>
          </label>
          <label className="flex items-center justify-center p-3 border rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50">
            <input type="radio" value="female" {...register("gender")} className="sr-only" />
            <span>Female</span>
          </label>
        </div>
        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
        <input type="date" {...register("dob")} className="w-full rounded-lg border-slate-200 p-3" />
        {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message as string}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
          <input type="number" {...register("height", { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 p-3" placeholder="175" />
          {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
          <input type="number" {...register("weight", { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 p-3" placeholder="70" />
          {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight.message as string}</p>}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Back
        </button>
        <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
          Next
        </button>
      </div>
    </form>
  );
}

function ActivityStep({ onNext, onBack, defaultValues }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Activity Level</label>
        <select {...register("activityLevel")} className="w-full rounded-lg border-slate-200 p-3">
          <option value="sedentary">Sedentary (Little to no exercise)</option>
          <option value="light">Light (1-3 days/week)</option>
          <option value="moderate">Moderate (3-5 days/week)</option>
          <option value="active">Active (6-7 days/week)</option>
          <option value="very_active">Very Active (Physical job/training)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Medical History (Optional)</label>
        <textarea {...register("medicalHistory")} className="w-full rounded-lg border-slate-200 p-3" rows={3} placeholder="Any injuries or conditions we should know about?" />
      </div>

      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Back
        </button>
        <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
          Next
        </button>
      </div>
    </form>
  );
}

function TargetStep({ onNext, onBack, defaultValues }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(targetSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Target Weight (kg)</label>
        <input type="number" {...register("targetWeight", { valueAsNumber: true })} className="w-full rounded-lg border-slate-200 p-3" placeholder="65" />
        {errors.targetWeight && <p className="text-red-500 text-xs mt-1">{errors.targetWeight.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Weekly Goal</label>
        <select {...register("weeklyGoal")} className="w-full rounded-lg border-slate-200 p-3">
          <option value="0.25">Lose 0.25 kg/week</option>
          <option value="0.5">Lose 0.5 kg/week</option>
          <option value="0.75">Lose 0.75 kg/week</option>
          <option value="1">Lose 1 kg/week</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Daily Steps Goal</label>
        <div className="grid grid-cols-3 gap-2">
          {["5000", "10000", "15000"].map((steps) => (
            <label key={steps} className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50">
              <input type="radio" value={steps} {...register("dailySteps")} className="sr-only" />
              <span className="font-bold text-slate-900">{steps}</span>
              <span className="text-xs text-slate-500">steps</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Back
        </button>
        <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          Start Plan <Check className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
