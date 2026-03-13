interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Evaluation {
  domainKnowledge: number;
  problemSolving: number;
  communication: number;
  estimatedSeniority: string;
  strengths: string[];
  weaknesses: string[];
  improvementPlan: string[];
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  specialization?: string;
  finalized: boolean;
  evaluation?: Evaluation;
}

interface InterviewFormValues {
  role?: string;
  level?: "junior" | "mid" | "senior";
  type?: "technical" | "behavioral" | "mixed";
  techstack?: string[];
  specialization?: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  level?: string;
  specialization?: string;
  techstack?: string[] | null;
  questionsCount?: number;
  createdAt?: string;
}

interface UserProfile {
  id: string;
  userId: string;
  profession: string;
  level: string;
  skills: string[];
  interviewType?: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  userId: string;
  plan: "casual" | "regular" | "pro";
  status: "active" | "inactive" | "cancelled";
  startsAt: string;
  endsAt?: string;
}

interface UserAccess {
  hasActiveSubscription: boolean;
  plan: string | null;
  trialUsed: boolean;
  periodStart?: Date | null;
}

interface InterviewSuggestion {
  role: string;
  type: string;
  level: string;
  techstack: string[];
}

interface RecentInterview {
  id: string;
  title?: string | null;
  role: string;
  type: string;
  level: string;
  techstack: string[];
  specialization?: string | null;
  questions?: string[];
  evaluation?: Evaluation | null;
  createdAt?: string | null;
}

interface AgentProps {
  userName: string;
  userId: string;
  mode?: "new" | "demo" | "try-again" | "change-questions";
  redirectOnFinish?: string;
  suggestions?: InterviewSuggestion[];
  recentInterviews?: RecentInterview[];
  recentInterviewsLabel?: string;
  cvFilename?: string | null;
  // try-again
  interviewId?: string;
  questions?: string[];
  // change-questions
  role?: string;
  level?: string;
  type?: string;
  techstack?: string[];
  specialization?: string;
  initialMessage?: string;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}
