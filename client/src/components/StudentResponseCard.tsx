import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentResponse, TeacherScore } from "@/lib/types";
import { Info, Layers } from "lucide-react";
import { logUserAction } from "@/lib/firebase-logging";


interface StudentResponseCardProps {
  student: StudentResponse;
  teacherScore: TeacherScore;
  isExpanded: boolean;
  showSimilarResponses: boolean;
  onScoreChange: (
    studentId: number,
    part: "part1" | "part2" | "total",
    score: string | number,
  ) => void;
  onToggleExplanation: () => void;
  onToggleSimilarResponses: () => void;
}

const StudentResponseCard: React.FC<StudentResponseCardProps> = ({
  student,
  teacherScore,
  isExpanded,
  showSimilarResponses,
  onScoreChange,
  onToggleExplanation,
  onToggleSimilarResponses,
}) => {
  const [activePart, setActivePart] = useState<"part1" | "part2" | null>(null);

  // Render text with or without highlighting for a specific part
  const renderStudentResponse = (part: "part1" | "part2") => {
    const responsePart = student.response[part];

    if (!isExpanded) {
      return (
        <div>
          <p className="text-sm">
            {/* <span className="font-medium">{responsePart.prefix}</span>{" "} */}
            {responsePart.completion}
          </p>
        </div>
      );
    }

    // For the expanded view, process prefix and completion separately
    const prefixText = responsePart.prefix;
    const completionText = responsePart.completion;

    // Apply highlighting only to the completion part
    const highlightedCompletion = student.featureImportance[part].reduce(
      (acc, { word, importance }) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        const bgColor = importance === "high" ? "bg-blue-300" : "bg-blue-100";
        return acc.replace(
          regex,
          `<span class="${bgColor} font-medium">$&</span>`,
        );
      },
      completionText
    );

    return (
      <div>
      <p className="text-sm">
        <span className="font-medium">{prefixText}</span>{" "}
        <span dangerouslySetInnerHTML={{ __html: highlightedCompletion }} />
      </p>
    </div>
    );
  };

  // Handler for similar responses toggle with Firebase logging
  const handleToggleSimilarResponses = (part: "part1" | "part2") => {
    const newPart = activePart === part ? null : part;
    setActivePart(newPart);

    if (!showSimilarResponses && newPart !== null) {
      onToggleSimilarResponses();
    } else if (showSimilarResponses && newPart === null) {
      onToggleSimilarResponses();
    }

    // Log the action to Firebase
    const actionName = activePart === part
      ? `Verberg meest vergelijkbare antwoorden deel ${part === "part1" ? "1" : "2"}`
      : `Toon meest vergelijkbare antwoorden deel ${part === "part1" ? "1" : "2"}`;

    logUserAction('click', actionName, {
      studentId: student.id,
      studentName: student.name,
      part: part,
      expanded: isExpanded,
      showingSimilarResponses: showSimilarResponses
    });
  };

  // Calculate confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 75) return "text-amber-600";
    return "text-red-500";
  };

  // Create default empty score if teacherScore is undefined
  const score = teacherScore || { part1: "", part2: "", total: "" };

  // Combine both part scores for the total AI score
  const totalAIScore = student.aiScore.total;

  // Function to render similar responses per answer part
  const renderSimilarResponsesForPart = (part: "part1" | "part2") => {
    const goodCount = part === "part1" ? student.pt1_similar_right : student.pt2_similar_right;
    const badCount = part === "part1" ? student.pt1_similar_wrong : student.pt2_similar_wrong;
    const totalSimilarCount = goodCount + badCount; // Total count for display

    return (
      <div className="text-xs bg-white p-2 rounded border border-gray-200 mt-1">
        <div className="flex items-center gap-1 mb-1">
          <span>
            {totalSimilarCount} soortgelijke antwoorden voor deel{" "}
            {part === "part1" ? "1" : "2"}:
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>{goodCount} wel goed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span>{badCount} niet goed</span>
          </div>
        </div>
      </div>
    );
  };

  // Function to render detailed similar responses per part
  const renderDetailedSimilarResponsesForPart = (part: "part1" | "part2") => {
    const responses = student.similarResponses[part];
    return (
      <div className="mt-2 border-l-2 border-primary pl-4">
        <h3 className="text-sm font-semibold mb-2">
          Meest vergelijkbare antwoorden voor deel {part === "part1" ? "1" : "2"}:
        </h3>
        {responses.map((response, index) => (
          <div
            key={index}
            className="mb-2 p-2 bg-white rounded border border-gray-200"
          >
            <div className="mb-1 text-xs text-gray-700">{response.response}</div>
            <div className="flex items-center gap-2">
              <div
                className={`rounded-full w-2 h-2 ${response.score === 1
                  ? "bg-green-500"
                  : response.score === 0
                    ? "bg-red-400"
                    : "bg-amber-400"
                  }`}
              ></div>
              <span className="text-xs">
                {response.score === 1
                  ? "Wel goed"
                  : response.score === 0
                    ? "Niet goed"
                    : "Niet goed"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="response-card bg-white/60 rounded-lg shadow p-4 border-2 border-blue-100/50 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg text-gray-800">
          {"Leerling " + student.id}
        </h2>
      </div>

      {/* Combined response */}
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-start">
            <h3 className="font-medium text-sm text-gray-700 mr-2">
              Antwoord:
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-2 py-1 border-r border-gray-200">
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-medium ${totalAIScore === 2
                      ? "text-green-600"
                      : totalAIScore === 1
                        ? "text-amber-600"
                        : "text-red-500"
                      }`}
                  >
                    AI score: {totalAIScore}/2
                  </span>
                  {isExpanded && (
                    <span className="text-xs text-gray-600 mt-0.5">
                      Zekerheid: {student.confidence}%
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-full px-2 hover:bg-amber-50 text-blue-800"
                onClick={() => {
                  onToggleExplanation();
                  // Log this action too
                  logUserAction('click', isExpanded ? 'Verberg uitleg' : 'Waarom?', {
                    studentId: student.id,
                    studentName: student.name
                  });
                }}
              >
                <Info className="h-3 w-3 mr-1" />
                {isExpanded ? "Verberg" : "Waarom?"}
              </Button>
            </div>

            <div className="flex border rounded overflow-hidden">
              <div
                className={`px-2 h-7 text-xs font-medium border-r flex items-center justify-center ${(score.part1 === "0" || score.part1 === 0) && (score.part2 === "0" || score.part2 === 0) ? "bg-primary text-white" : "bg-gray-100"}`}
              >
                0
              </div>
              <div
                className={`px-2 h-7 text-xs font-medium border-r flex items-center justify-center ${((score.part1 === "1" || score.part1 === 1) && (score.part2 === "0" || score.part2 === 0)) || ((score.part1 === "0" || score.part1 === 0) && (score.part2 === "1" || score.part2 === 1)) ? "bg-primary text-white" : "bg-gray-100"}`}
              >
                1
              </div>
              <div
                className={`px-2 h-7 text-xs font-medium flex items-center justify-center ${(score.part1 === "1" || score.part1 === 1) && (score.part2 === "1" || score.part2 === 1) ? "bg-primary text-white" : "bg-gray-100"}`}
              >
                2
              </div>
            </div>
          </div>
        </div>

        {/* Part 1 response */}
        <div className="mb-4 border-l-4 border-gray-400 bg-gray-50/50 rounded-md p-3">
          <div className="flex justify-between items-center mb-1">
          
          <h4 className="text-xs font-semibold text-gray-700"> {student.response.part1.prefix} </h4>
            {/* <h4 className="text-xs font-semibold text-gray-700"> Deel 1</h4> */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                AI score:{" "}
                <span
                  className={
                    student.aiScore.part1 === 1
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {student.aiScore.part1}/1
                </span>
              </span>
              <div className="flex border rounded overflow-hidden">
                <Button
                  variant={
                    score.part1 === "0" || score.part1 === 0
                      ? "default"
                      : "ghost"
                  }
                  className={`px-2 h-6 text-xs font-medium border-r ${score.part1 === "0" || score.part1 === 0 ? "bg-primary text-white" : ""}`}
                  onClick={() => {
                    onScoreChange(student.id, "part1", "0");
                    // Log score change
                    logUserAction('click', 'Score deel 1: 0', {
                      studentId: student.id,
                      studentName: student.name,
                      part: "part1",
                      score: 0
                    });
                  }}
                >
                  0
                </Button>
                <Button
                  variant={
                    score.part1 === "1" || score.part1 === 1
                      ? "default"
                      : "ghost"
                  }
                  className={`px-2 h-6 text-xs font-medium ${score.part1 === "1" || score.part1 === 1 ? "bg-primary text-white" : ""}`}
                  onClick={() => {
                    onScoreChange(student.id, "part1", "1");
                    // Log score change
                    logUserAction('click', 'Score deel 1: 1', {
                      studentId: student.id,
                      studentName: student.name,
                      part: "part1",
                      score: 1
                    });
                  }}
                >
                  1
                </Button>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700 mb-2 bg-gray-50 p-2 rounded-md">
            {renderStudentResponse("part1")}
          </div>

          {isExpanded && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 bg-white hover:bg-gray-50 w-full my-2"
                onClick={() => handleToggleSimilarResponses("part1")}
              >
                <Layers className="h-3 w-3 mr-1" />
                {activePart === "part1"
                  ? "Verberg meest vergelijkbare antwoorden deel 1"
                  : "Toon meest vergelijkbare antwoorden deel 1"}
              </Button>

              {activePart === "part1" && showSimilarResponses && (
                <div>
                  {renderSimilarResponsesForPart("part1")}
                  {renderDetailedSimilarResponsesForPart("part1")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Part 2 response */}
        <div className="border-l-4 border-gray-300 bg-gray-50/50 rounded-md p-3">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold text-gray-700">{student.response.part2.prefix} </h4>
            {/* <h4 className="text-xs font-semibold text-gray-700">Deel 2</h4> */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                AI score:{" "}
                <span
                  className={
                    student.aiScore.part2 === 1
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {student.aiScore.part2}/1
                </span>
              </span>
              <div className="flex border rounded overflow-hidden">
                <Button
                  variant={
                    score.part2 === "0" || score.part2 === 0
                      ? "default"
                      : "ghost"
                  }
                  className={`px-2 h-6 text-xs font-medium border-r ${score.part2 === "0" || score.part2 === 0 ? "bg-primary text-white" : ""}`}
                  onClick={() => {
                    onScoreChange(student.id, "part2", "0");
                    // Log score change
                    logUserAction('click', 'Score deel 2: 0', {
                      studentId: student.id,
                      studentName: student.name,
                      part: "part2",
                      score: 0
                    });
                  }}
                >
                  0
                </Button>
                <Button
                  variant={
                    score.part2 === "1" || score.part2 === 1
                      ? "default"
                      : "ghost"
                  }
                  className={`px-2 h-6 text-xs font-medium ${score.part2 === "1" || score.part2 === 1 ? "bg-primary text-white" : ""}`}
                  onClick={() => {
                    onScoreChange(student.id, "part2", "1");
                    // Log score change
                    logUserAction('click', 'Score deel 2: 1', {
                      studentId: student.id,
                      studentName: student.name,
                      part: "part2",
                      score: 1
                    });
                  }}
                >
                  1
                </Button>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700 mb-2 bg-gray-50 p-2 rounded-md">
            {renderStudentResponse("part2")}
          </div>

          {isExpanded && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6 bg-white hover:bg-gray-50 w-full my-2"
                onClick={() => handleToggleSimilarResponses("part2")}
              >
                <Layers className="h-3 w-3 mr-1" />
                {activePart === "part2"
                  ? "Verberg meest vergelijkbare antwoorden deel 2"
                  : "Toon meest vergelijkbare antwoorden deel 2"}
              </Button>

              {activePart === "part2" && showSimilarResponses && (
                <div>
                  {renderSimilarResponsesForPart("part2")}
                  {renderDetailedSimilarResponsesForPart("part2")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 flex items-center justify-end gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-blue-300 rounded"></span>
            <span>Sterk relevant voor AI score</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-blue-100 rounded"></span>
            <span>Relevant voor AI score</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StudentResponseCard;