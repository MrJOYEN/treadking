-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  goal TEXT NOT NULL CHECK (goal IN ('5k', '10k', 'half_marathon', 'marathon', 'ultra_marathon')),
  weekly_availability INTEGER NOT NULL DEFAULT 3,
  previous_experience TEXT[] DEFAULT '{}',
  physical_constraints TEXT[] DEFAULT '{}',
  treadmill_brand TEXT,
  max_speed DECIMAL(4,1) NOT NULL DEFAULT 12.0,
  max_incline DECIMAL(4,1) NOT NULL DEFAULT 15.0,
  has_heart_rate_monitor BOOLEAN NOT NULL DEFAULT false,
  preferred_speed_range JSONB NOT NULL DEFAULT '{"walkingSpeed": 5, "runningSpeed": 10, "sprintSpeed": 15}',
  comfortable_inclines JSONB NOT NULL DEFAULT '{"flat": 0, "moderate": 5, "steep": 10}',
  usual_workout_duration INTEGER NOT NULL DEFAULT 45,
  preferred_workout_times TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create training_plans table
CREATE TABLE public.training_plans (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  goal TEXT NOT NULL,
  total_weeks INTEGER NOT NULL,
  workouts_per_week INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generated_by_ai BOOLEAN NOT NULL DEFAULT false,
  ai_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create planned_workouts table
CREATE TABLE public.planned_workouts (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  training_plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  estimated_distance INTEGER NOT NULL, -- in meters
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  target_pace DECIMAL(5,2), -- minutes per km
  notes TEXT,
  week_number INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create training_segments table
CREATE TABLE public.training_segments (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  planned_workout_id UUID NOT NULL REFERENCES public.planned_workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  distance INTEGER, -- in meters (optional, can be time-based)
  target_speed DECIMAL(4,1) NOT NULL, -- km/h
  target_incline DECIMAL(4,1) NOT NULL, -- percentage
  intensity TEXT NOT NULL,
  rpe INTEGER NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  instruction TEXT NOT NULL,
  recovery_after INTEGER, -- seconds of recovery after this segment
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create workout_sessions table
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  planned_workout_id UUID REFERENCES public.planned_workouts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  total_distance INTEGER NOT NULL, -- in meters
  total_time INTEGER NOT NULL, -- in seconds
  average_pace DECIMAL(5,2) NOT NULL, -- minutes per km
  average_heart_rate INTEGER,
  workout_type TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create splits table
CREATE TABLE public.splits (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  kilometer INTEGER NOT NULL,
  time INTEGER NOT NULL, -- in seconds
  pace DECIMAL(5,2) NOT NULL, -- minutes per km
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for training_plans
CREATE POLICY "Users can view own training plans" ON public.training_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training plans" ON public.training_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training plans" ON public.training_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training plans" ON public.training_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for planned_workouts
CREATE POLICY "Users can view own planned workouts" ON public.planned_workouts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.training_plans WHERE id = training_plan_id
    )
  );

CREATE POLICY "Users can create planned workouts for own plans" ON public.planned_workouts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.training_plans WHERE id = training_plan_id
    )
  );

CREATE POLICY "Users can update own planned workouts" ON public.planned_workouts
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.training_plans WHERE id = training_plan_id
    )
  );

CREATE POLICY "Users can delete own planned workouts" ON public.planned_workouts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.training_plans WHERE id = training_plan_id
    )
  );

-- Create RLS policies for training_segments
CREATE POLICY "Users can view own training segments" ON public.training_segments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT tp.user_id 
      FROM public.training_plans tp
      JOIN public.planned_workouts pw ON tp.id = pw.training_plan_id
      WHERE pw.id = planned_workout_id
    )
  );

CREATE POLICY "Users can create training segments for own workouts" ON public.training_segments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT tp.user_id 
      FROM public.training_plans tp
      JOIN public.planned_workouts pw ON tp.id = pw.training_plan_id
      WHERE pw.id = planned_workout_id
    )
  );

CREATE POLICY "Users can update own training segments" ON public.training_segments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT tp.user_id 
      FROM public.training_plans tp
      JOIN public.planned_workouts pw ON tp.id = pw.training_plan_id
      WHERE pw.id = planned_workout_id
    )
  );

CREATE POLICY "Users can delete own training segments" ON public.training_segments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT tp.user_id 
      FROM public.training_plans tp
      JOIN public.planned_workouts pw ON tp.id = pw.training_plan_id
      WHERE pw.id = planned_workout_id
    )
  );

-- Create RLS policies for workout_sessions
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for splits
CREATE POLICY "Users can view own splits" ON public.splits
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id
    )
  );

CREATE POLICY "Users can create splits for own sessions" ON public.splits
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id
    )
  );

CREATE POLICY "Users can update own splits" ON public.splits
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id
    )
  );

CREATE POLICY "Users can delete own splits" ON public.splits
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.workout_sessions WHERE id = workout_session_id
    )
  );

-- Create trigger function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.training_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    level,
    goal,
    weekly_availability,
    max_speed,
    max_incline,
    has_heart_rate_monitor,
    usual_workout_duration
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'beginner',
    '5k',
    3,
    12.0,
    15.0,
    false,
    45
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_training_plans_user_id ON public.training_plans(user_id);
CREATE INDEX idx_planned_workouts_training_plan_id ON public.planned_workouts(training_plan_id);
CREATE INDEX idx_training_segments_planned_workout_id ON public.training_segments(planned_workout_id);
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_splits_workout_session_id ON public.splits(workout_session_id);
CREATE INDEX idx_workout_sessions_date ON public.workout_sessions(date);
CREATE INDEX idx_planned_workouts_week_day ON public.planned_workouts(week_number, day_of_week);