import Papa from 'papaparse';
import { QuestionData, StudentResponse, FeatureImportanceItem, SimilarResponse } from './types';

function parseFeatureImportance(lightHighlight: string, darkHighlight: string): FeatureImportanceItem[] {
  const items: FeatureImportanceItem[] = [];
  // Process light highlights
  if (lightHighlight) {
    lightHighlight.split(',').forEach(item => {
      const word = item.trim();
      if (word) {
        items.push({ word, importance: 'low' });
      }
    });
  }
  // Process dark highlights
  if (darkHighlight) {
    darkHighlight.split(',').forEach(item => {
      const word = item.trim();
      if (word) {
        items.push({ word, importance: 'high' });
      }
    });
  }
  return items;
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
        contextQuestion: row.context_question,
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

    const similarResponsesPart1 = parseSimilarResponses(
      [row.pt1_sim_response_1, row.pt1_sim_response_2, row.pt1_sim_response_3],
      [row.pt1_sim_response_score_1, row.pt1_sim_response_score_2, row.pt1_sim_response_score_3]
    );

    const similarResponsesPart2 = parseSimilarResponses(
      [row.pt2_sim_response_1, row.pt2_sim_response_2, row.pt2_sim_response_3],
      [row.pt2_sim_response_score_1, row.pt2_sim_response_score_2, row.pt2_sim_response_score_3]
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
        part1: parseFeatureImportance(row.deel1_light_highlight, row.deel1_dark_highlight),
        part2: parseFeatureImportance(row.deel2_light_highlight, row.deel2_dark_highlight)
      },
      similarResponses: {
        part1: similarResponsesPart1,
        part2: similarResponsesPart2
      },
      pt1_similar_right: parseInt(row.pt1_similar_right) || 0,
      pt1_similar_wrong: parseInt(row.pt1_similar_wrong) || 0,
      pt2_similar_right: parseInt(row.pt2_similar_right) || 0,
      pt2_similar_wrong: parseInt(row.pt2_similar_wrong) || 0,
    };

    question.studentResponses.push(studentResponse);
  });

  return Array.from(questions.values());
}