import Papa from 'papaparse';
import { QuestionData, StudentResponse, FeatureImportanceItem, SimilarResponse } from './types';

function parseFeatureImportance(text: string): FeatureImportanceItem[] {
  if (!text) return [];
  return text.split(',').map(item => {
    const [word, importance] = item.split(':').map(s => s.trim());
    return {
      word,
      importance: (importance || 'low') as 'low' | 'medium' | 'high'
    };
  }).filter(item => item.word);
}

function parseSimilarResponses(responses: string[], scores: string[]): SimilarResponse[] {
  const result: SimilarResponse[] = [];

  for (let i = 0; i < responses.length; i++) {
    if (responses[i] && scores[i]) {
      result.push({
        response: responses[i],
        score: parseFloat(scores[i]) || 0
      });
    }
  }

  return result;
}

export function parseCSV(csvContent: string): QuestionData[] {
  const results = Papa.parse(csvContent, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true
  });

  const questions = new Map<string, QuestionData>();

  results.data.forEach((row: any) => {
    const questionId = row.question_id;

    if (!questions.has(questionId)) {
      questions.set(questionId, {
        questionId,
        assignmentName: `Question ${questionId}`,
        question: row.question_text,
        modelAnswer: {
          part1: {
            prefix: row.modelantwoord_deel1_prefix,
            completion: row.modelantwoord_deel1_completion
          },
          part2: {
            prefix: row.modelantwoord_deel2_prefix,
            completion: row.modelantwoord_deel2_completion
          }
        },
        studentResponses: []
      });
    }

    const question = questions.get(questionId)!;

    // Parse similar responses
    const similarResponses = parseSimilarResponses(
      [row.sim_response_1, row.sim_response_2, row.sim_response_3],
      [row.sim_response_score_1, row.sim_response_score_2, row.sim_response_score_3]
    );

    const studentResponse: StudentResponse = {
      id: parseInt(row.student_id.replace(/\D/g, '')),
      name: `Student ${row.student_id}`,
      response: {
        part1: {
          prefix: row.antwoord_deel1_prefix,
          completion: row.antwoord_deel1_completion
        },
        part2: {
          prefix: row.antwoord_deel2_prefix,
          completion: row.antwoord_deel2_completion
        }
      },
      aiScore: {
        part1: parseInt(row.ai_score_deel1) || 0,
        part2: parseInt(row.ai_score_deel2) || 0,
        total: parseInt(row.ai_score_total) || 0
      },
      confidence: parseInt(row.ai_confidence) || 0,
      featureImportance: {
        part1: parseFeatureImportance(row.deel1_light_highlight),
        part2: parseFeatureImportance(row.deel2_light_highlight)
      },
      similarResponses
    };

    question.studentResponses.push(studentResponse);
  });

  return Array.from(questions.values());
}