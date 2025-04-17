import React from 'react';
import { Card } from '@/components/ui/card';
import { ModelAnswer } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Maximize2 } from 'lucide-react';

interface QuestionPanelProps {
  contextQuestion: string;
  question: string;
  modelAnswer: ModelAnswer;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ question, contextQuestion, modelAnswer }) => {
  return (
    <div className="col-span-12 md:col-span-4 space-y-4 md:sticky md:top-4 md:self-start">
      {/* Test Question */}
      <Card className="p-4 bg-blue-50/80 rounded-lg shadow-sm border border-blue-100">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900">Toetsvraag</h2>
        </div>
        <p className="text-sm text-gray-800">
          {contextQuestion} {/* Display context question */}
          <br />
          <br />
          <strong>{question}</strong> {/* Making the question bold */}
        </p>
      </Card>
      
      {/* Correctievoorschrift */}
      <Card className="p-4 bg-white rounded-lg shadow-sm border-2 border-blue-100">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900">Correctievoorschrift</h2>
          <h3 className="text-xs text-gray-500">1 punt per deel</h3>
        </div>
        
        <div className="space-y-4">
          <div className="border-l-4 border-gray-400 pl-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">Deel 1</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{modelAnswer.part1.prefix}</span> 
              {' '}{modelAnswer.part1.completion}
            </p>
          </div>
          
          <div className="border-l-4 border-gray-300 pl-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">Deel 2</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{modelAnswer.part2.prefix}</span> 
              {' '}{modelAnswer.part2.completion}
            </p>
          </div>
        </div>
      </Card>
      
      
    </div>
  );
};

export default QuestionPanel;
