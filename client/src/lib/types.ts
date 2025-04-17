
export interface ModelAnswer {
  part1: {
    prefix: string;
    completion: string;
  };
  part2: {
    prefix: string;
    completion: string;
  };
}

export interface ResponsePart {
  prefix: string;
  completion: string;
}

export interface StudentResponse {
  id: number;
  name?: string;
  response: {
    part1: ResponsePart;
    part2: ResponsePart;
  };
  aiScore: {
    part1: number;
    part2: number;
    total: number;
  };
  confidence: number;
  featureImportance: {
    part1: FeatureImportanceItem[];
    part2: FeatureImportanceItem[];
  };
  similarResponses: {
    part1: SimilarResponse[];
    part2: SimilarResponse[];
  };  
  pt1_similar_right: number;
  pt1_similar_wrong: number;
  pt2_similar_right: number;
  pt2_similar_wrong: number;
}

export interface FeatureImportanceItem {
  word: string;
  importance: "low" | "medium" | "high";
}

export interface SimilarResponse {
  response: string;
  score: number;
}

export interface QuestionData {
  questionId: string;
  assignmentName: string;
  contextQuestion: string;
  question: string;
  modelAnswer: ModelAnswer;
  studentResponses: StudentResponse[];
}

export interface TeacherScore {
  part1: string | number;
  part2: string | number;
  total: string | number;
}

export interface ScoringStats {
  totalStudents: number;
  scoredStudents: number;
  pendingStudents: number;
}
