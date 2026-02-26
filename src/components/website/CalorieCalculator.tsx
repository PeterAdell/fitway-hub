import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calculator, ArrowRight } from "lucide-react";

const schema = z.object({
  weight: z.number().min(20, "Weight must be at least 20kg").max(300, "Weight must be less than 300kg"),
  height: z.number().min(100, "Height must be at least 100cm").max(250, "Height must be less than 250cm"),
  age: z.number().min(10, "Age must be at least 10").max(100, "Age must be less than 100"),
  gender: z.enum(["male", "female"]),
  activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

type FormData = z.infer<typeof schema>;

export function CalorieCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // Mifflin-St Jeor Equation
    let bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age;
    if (data.gender === "male") {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * multipliers[data.activity];
    setResult(Math.round(tdee));
  };

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 md:p-8 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-300">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Daily Calorie Calculator</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Gender</label>
            <select {...register("gender")} className="w-full rounded-lg border-white/20 bg-white/5 p-2.5 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500">
              <option className="bg-slate-900" value="male">Male</option>
              <option className="bg-slate-900" value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Age</label>
            <input type="number" {...register("age", { valueAsNumber: true })} className="w-full rounded-lg border-white/20 bg-white/5 p-2.5 text-sm text-white placeholder:text-white/40 focus:ring-emerald-500 focus:border-emerald-500" placeholder="25" />
            {errors.age && <p className="text-rose-400 text-xs mt-1">{errors.age.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Weight (kg)</label>
            <input type="number" {...register("weight", { valueAsNumber: true })} className="w-full rounded-lg border-white/20 bg-white/5 p-2.5 text-sm text-white placeholder:text-white/40 focus:ring-emerald-500 focus:border-emerald-500" placeholder="70" />
            {errors.weight && <p className="text-rose-400 text-xs mt-1">{errors.weight.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Height (cm)</label>
            <input type="number" {...register("height", { valueAsNumber: true })} className="w-full rounded-lg border-white/20 bg-white/5 p-2.5 text-sm text-white placeholder:text-white/40 focus:ring-emerald-500 focus:border-emerald-500" placeholder="175" />
            {errors.height && <p className="text-rose-400 text-xs mt-1">{errors.height.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Activity Level</label>
          <select {...register("activity")} className="w-full rounded-lg border-white/20 bg-white/5 p-2.5 text-sm text-white focus:ring-emerald-500 focus:border-emerald-500">
            <option className="bg-slate-900" value="sedentary">Sedentary (Little to no exercise)</option>
            <option className="bg-slate-900" value="light">Light (Exercise 1-3 times/week)</option>
            <option className="bg-slate-900" value="moderate">Moderate (Exercise 4-5 times/week)</option>
            <option className="bg-slate-900" value="active">Active (Daily exercise or intense exercise 3-4 times/week)</option>
            <option className="bg-slate-900" value="very_active">Very Active (Intense exercise 6-7 times/week)</option>
          </select>
        </div>

        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors backdrop-blur-sm">
          Calculate <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 backdrop-blur-sm bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-center animate-in fade-in slide-in-from-bottom-4">
          <p className="text-sm text-emerald-300 font-medium mb-1">Your estimated daily needs</p>
          <p className="text-3xl font-bold text-emerald-200">{result} <span className="text-lg font-normal text-emerald-300">kcal/day</span></p>
        </div>
      )}
    </div>
  );
}
